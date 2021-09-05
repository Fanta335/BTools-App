const config = {
  CLITextInput: document.getElementById("CLITextInput") as HTMLInputElement,
  CLIOutputDiv: document.getElementById("CLIOutputDiv") as HTMLDivElement,
  url: "https://openlibrary.org/search",
};

type ValidatorResponse = {
  isValid: boolean;
  errorMessage: string;
};

type OpenlibraryResponse = Required<TitleResponse> | Required<AuthorResponse>;

type TitleResponse = {
  numFound: number;
  start: number;
  numFoundExact: boolean;
  docs: Required<TitleDoc>[];
  num_found: number;
  q: string;
  offset: null;
};

type AuthorResponse = {
  numFound: number;
  start: number;
  numFoundExact: boolean;
  docs: Required<AuthorDoc>[];
};

type TitleDoc = {
  author_name: string[];
  title: string;
  first_publish_year: number;
  key: string;
  isbn: string[];
  type: "work";
};

type AuthorDoc = {
  key: string;
  type: "author";
  name: string;
  top_work: string;
  work_count: number;
};

class Command {
  private _data: string;
  private _next: Command | undefined;
  private _prev: Command | undefined;

  constructor(commandInput: string) {
    this._data = commandInput;
    this._next = undefined;
    this._prev = undefined;
  }

  public get data() {
    return this._data;
  }

  public set data(stringInput: string) {
    this._data = stringInput;
  }

  public get next() {
    return this._next;
  }

  public set next(command: Command | undefined) {
    this._next = command;
  }

  public get prev() {
    return this._prev;
  }

  public set prev(command: Command | undefined) {
    this._prev = command;
  }
}

class CommandList {
  private _head: Command | undefined;
  private _tail: Command | undefined;
  private _iterator: Command | undefined;

  constructor() {
    this._head = undefined;
    this._tail = this._head;
    this._iterator = this._tail;
  }

  public get head() {
    return this._head;
  }

  public get tail() {
    return this._tail;
  }

  public get iterator() {
    return this._iterator;
  }

  public set iterator(target: Command | undefined) {
    this._iterator = target;
  }

  public add(newCommand: Command): void {
    if (this._tail === undefined) {
      this._head = newCommand;
      this._tail = this._head;
      this._iterator = this._tail;
    } else {
      this._tail.next = newCommand;
      newCommand.prev = this._tail;
      newCommand.next = undefined;
      this._tail = newCommand;
      this._iterator = this._tail;
    }
  }

  public peekLast(): Command | undefined {
    if (this._tail === undefined) return undefined;

    return this._tail;
  }
}

class BTools {
  public static commandLineParser(CLIInputString: string): string[] {
    let parsedArray = CLIInputString.trim().split(" ");
    return parsedArray;
  }

  public static universalValidator(parsedCLIArray: string[]): ValidatorResponse {
    const commandList = ["searchByTitle", "uniqueNameCount", "titlesByUniqueName"];

    if (parsedCLIArray[0] !== "BTools") {
      return {
        isValid: false,
        errorMessage: `Invalid input. This app supports only BTools.\nUsage:\n  BTools command_name argument_1 [argument_2]\nCommands:\n  ${commandList.join(
          "\n"
        )}`,
      };
    }
    if (parsedCLIArray.length === 1) {
      return { isValid: false, errorMessage: `No argument input. BTools commands:\n${commandList.join("\n")}` };
    }

    if (commandList.indexOf(parsedCLIArray[1]) === -1) {
      return {
        isValid: false,
        errorMessage: `'${parsedCLIArray[1]}' is not a BTools command. BTools commands:\n${commandList.join("\n")}`,
      };
    }

    let argsArray = parsedCLIArray.slice(2, parsedCLIArray.length);

    // validators for each command
    if (parsedCLIArray[1] === "searchByTitle") {
      return BTools.searchByTitleValidator(argsArray);
    }

    if (parsedCLIArray[1] === "uniqueNameCount") {
      return BTools.singleArgValidator("uniqueNameCount", argsArray);
    }

    if (parsedCLIArray[1] === "titlesByUniqueName") {
      return BTools.singleArgValidator("titlesByUniqueName", argsArray);
    }

    return { isValid: true, errorMessage: "" };
  }

  static searchByTitleValidator(argsArray: string[]) {
    if (argsArray.length !== 1 && argsArray.length !== 2) {
      return {
        isValid: false,
        errorMessage: `Invalid argument. 'searchByTitle' usage:\nBTools searchByTitle bookTitle [maximumNumberOfResults]`,
      };
    }

    // validation for searchByTitle [bookTitle] [maximumNumberOfResults]
    if (argsArray.length === 2) {
      if (!BTools.isIntegerString(argsArray[1])) {
        return { isValid: false, errorMessage: `Last element should contain only integer of 1 to 100` };
      }

      if (BTools.isIntegerString(argsArray[1]) && (Number(argsArray[1]) < 1 || Number(argsArray[1]) > 100)) {
        return { isValid: false, errorMessage: `Last element should contain integer of 1 to 100` };
      }
    }

    return { isValid: true, errorMessage: "" };
  }

  static singleArgValidator(commandName: string, argsArray: string[]) {
    if (argsArray.length !== 1) return { isValid: false, errorMessage: `Invalid argument. '${commandName}' usage:\nBTools ${commandName} authorNameFragment` };

    if (commandName === "uniqueNameCount") {
    }

    if (commandName === "titlesByUniqueName") {
    }

    return { isValid: true, errorMessage: "" };
  }

  public static appendMirrorParagraph(parentDiv: HTMLDivElement) {
    parentDiv.innerHTML += `
      <p class="m-0 command-output"><span class='user-name'>student</span> <span class='atmark'>@</span> <span class='pc-name'>recursionist</span>: ${config.CLITextInput.value}
      </p>
    `;

    return;
  }

  public static queryStringFromParsedCLIArray(parsedCLIArray: string[]): string {
    let queryString = "";

    if (parsedCLIArray[1] === "searchByTitle") {
      if (parsedCLIArray.length === 3) queryString = `.json?title=${parsedCLIArray[2]}`;
      else if (parsedCLIArray.length === 4) queryString = `.json?title=${parsedCLIArray[2]}&fields=*,availability&limit=${parsedCLIArray[3]}`;
    }
    if (parsedCLIArray[1] === "uniqueNameCount" || parsedCLIArray[1] === "titlesByUniqueName") {
      queryString = `/authors.json?q=${parsedCLIArray[2]}`;
    }

    return queryString;
  }

  public static async queryResponseObjectFromQueryString(queryString: string) {
    let queryResponseObject: Required<OpenlibraryResponse> = {
      numFound: 0,
      start: 0,
      numFoundExact: true,
      docs: [],
      num_found: 0,
      q: "",
      offset: null,
    };
    let queryURL = config.url + queryString;

    await fetch(queryURL)
      .then((response) => response.json())
      .then((data) => (queryResponseObject = data))
      .catch((error) => console.log("Error: ", error));

    return queryResponseObject;
  }

  // 整数を表す文字列であるかを返す e.g. 1 -> true, 1.2 -> false, one -> false
  public static isIntegerString(arg: string) {
    let parsedNum = Number(arg);
    return typeof parsedNum === "number" && !isNaN(parsedNum) && parsedNum % 1 === 0;
  }
}

class View {
  public static addKeyboardEventListenerToCLI(commandList: CommandList) {
    config.CLITextInput.addEventListener("keydown", (event) => Controller.submitSearch(event, commandList));
  }

  public static appendResultParagraph(validatorResponse: ValidatorResponse) {
    let promptColor = "";
    let promptName = "BTools";
    if (validatorResponse["isValid"]) {
      promptColor = "prompt-success";
    } else {
      promptName += "Error";
      promptColor = "prompt-error";
    }
    config.CLIOutputDiv.innerHTML += `
      <p class="m-0">
        <span class='${promptColor}'>${promptName}: </span><br>
        <span class="command-output">${validatorResponse["errorMessage"]}</span>
      </p><br>
    `;
    return;
  }

  public static appendResponseParagraphsFromQueryResponseObject(
    commandName: string,
    parentDiv: HTMLDivElement,
    queryResponseObject: Required<OpenlibraryResponse>
  ) {
    if (queryResponseObject["docs"].length == 0)
      parentDiv.innerHTML += `<p class="m-0 command-output"> <span class='prompt-success'>openLibrary</span>: 0 matches </p>`;
    else {
      parentDiv.innerHTML += `<p class="m-0 command-output"> <span class='prompt-success'>openLibrary</span>: at least ${queryResponseObject["docs"].length} matches`;

      if (commandName === "searchByTitle") {
        View.appendResponseToSearchByTitle(parentDiv, queryResponseObject);
      }

      if (commandName === "uniqueNameCount") {
        View.appendResponseToUniqueNameCount(parentDiv, queryResponseObject);
      }

      if (commandName === "titlesByUniqueName") {
        View.appendResponseToTitlesByUniqueName(parentDiv, queryResponseObject);
      }
    }
    return;
  }

  public static appendResponseToSearchByTitle(parentDiv: HTMLDivElement, queryResponseObject: Required<OpenlibraryResponse>) {
    for (let documentIndex = 0; documentIndex < queryResponseObject["docs"].length; documentIndex++) {
      let queryResponseDocument = queryResponseObject["docs"][documentIndex] as TitleDoc;

      let matchParagraphString = `<p class="m-0 command-output">
      <span class='prompt-success'>openLibrary</span>: [${documentIndex + 1}]
      author: ${queryResponseDocument["author_name"]}
      title: ${queryResponseDocument["title"]}
      first published: ${queryResponseDocument["first_publish_year"]}
      key: ${queryResponseDocument["key"]}
      `;

      if (queryResponseDocument.hasOwnProperty("isbn")) matchParagraphString += `ISBN: ${queryResponseDocument["isbn"][0]}</p>`;
      else matchParagraphString += `</p>`;

      parentDiv.innerHTML += matchParagraphString;
    }
  }

  public static appendResponseToUniqueNameCount(parentDiv: HTMLDivElement, queryResponseObject: Required<OpenlibraryResponse>) {
    for (let documentIndex = 0; documentIndex < queryResponseObject["docs"].length; documentIndex++) {
      let queryResponseDocument = queryResponseObject["docs"][documentIndex] as AuthorDoc;

      let matchParagraphString = `<p class="m-0 command-output">
      <span class='prompt-success'>openLibrary</span>: [${documentIndex + 1}]
      author_name: ${queryResponseDocument["name"]} `;

      matchParagraphString += `</p>`;

      parentDiv.innerHTML += matchParagraphString;
    }
  }

  public static appendResponseToTitlesByUniqueName(parentDiv: HTMLDivElement, queryResponseObject: Required<OpenlibraryResponse>) {
    for (let documentIndex = 0; documentIndex < queryResponseObject["docs"].length; documentIndex++) {
      let queryResponseDocument = queryResponseObject["docs"][documentIndex] as AuthorDoc;

      let matchParagraphString = `<p class="m-0 command-output">
      <span class='prompt-success'>openLibrary</span>: [${documentIndex + 1}]
      author_name: ${queryResponseDocument["name"]}
      top_work: ${queryResponseDocument["top_work"]} `;

      matchParagraphString += `</p>`;

      parentDiv.innerHTML += matchParagraphString;
    }
  }

  public static showPrevCommand(commandList: CommandList) {
    if (commandList.iterator === undefined) return;
    else {
      config.CLITextInput.value = commandList.iterator.data;
      commandList.iterator = commandList.iterator !== commandList.head ? commandList.iterator.prev : commandList.iterator;
    }
  }

  public static showNextCommand(commandList: CommandList) {
    if (commandList.iterator === undefined) return;
    else {
      config.CLITextInput.value = commandList.iterator.data;
      commandList.iterator = commandList.iterator !== commandList.tail ? commandList.iterator.next : commandList.iterator;
    }
  }
}

class Controller {
  public static build() {
    let commandList = new CommandList();
    View.addKeyboardEventListenerToCLI(commandList);
  }

  public static async submitSearch(event: KeyboardEvent, commandList: CommandList) {
    if (event.key === "Enter") {
      Controller.addCommandToList(commandList);
      BTools.appendMirrorParagraph(config.CLIOutputDiv);
      config.CLIOutputDiv.scrollTop = config.CLIOutputDiv.scrollHeight;
      if (config.CLITextInput.value === "") return;

      let parsedCLIArray = BTools.commandLineParser(config.CLITextInput.value);
      config.CLITextInput.value = "";

      let validatorResponse = BTools.universalValidator(parsedCLIArray);

      if (!validatorResponse["isValid"]) {
        View.appendResultParagraph(validatorResponse);
        config.CLIOutputDiv.scrollTop = config.CLIOutputDiv.scrollHeight;
        config.CLITextInput.value = "";
        return;
      }

      let queryString = BTools.queryStringFromParsedCLIArray(parsedCLIArray);
      config.CLIOutputDiv.scrollTop = config.CLIOutputDiv.scrollHeight;

      let queryResponseObject = await BTools.queryResponseObjectFromQueryString(queryString);

      View.appendResponseParagraphsFromQueryResponseObject(parsedCLIArray[1], config.CLIOutputDiv, queryResponseObject);
      config.CLIOutputDiv.scrollTop = config.CLIOutputDiv.scrollHeight;
    } else if (event.key === "ArrowUp") {
      View.showPrevCommand(commandList);
    } else if (event.key === "ArrowDown") {
      View.showNextCommand(commandList);
    }
  }

  public static addCommandToList(commandList: CommandList) {
    if (config.CLITextInput.value === "") return;
    commandList.add(new Command(config.CLITextInput.value));
  }
}

Controller.build();
