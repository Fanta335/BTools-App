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
    let parsedArray = CLIInputString.split(" ");
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
    if (argsArray.length !== 1)
      return { isValid: false, errorMessage: `Invalid argument. '${commandName}' usage:\nBTools ${commandName} authorNameFragment` };

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

  public static appendResultParagraph(validatorResponse: ValidatorResponse) {
    console.log(validatorResponse);

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
    console.log(queryString);

    await fetch(queryURL)
      .then((response) => response.json())
      .then((data) => (queryResponseObject = data))
      .catch((error) => console.log("Error: ", error));

    return queryResponseObject;
  }

  public static appendResponseParagraphsFromQueryResponseObject(
    commandName: string,
    parentDiv: HTMLDivElement,
    queryResponseObject: Required<OpenlibraryResponse>
  ) {
    console.log(queryResponseObject);
    // 一致するものがない場合は、その旨のメッセージをレンダリングします。
    if (queryResponseObject["docs"].length == 0)
      parentDiv.innerHTML += `<p class="m-0 command-output"> <span style='color:turquoise'>openLibrary</span>: 0 matches </p>`;
    // 一致するものがあれば、それぞれを繰り返し処理し、著者、タイトル、最初の出版年、オブジェクトキー、ISBNを表示する段落を追加します。
    else {
      // 一致した数を表示
      parentDiv.innerHTML += `<p class="m-0 command-output"> <span style='color:turquoise'>openLibrary</span>: at least ${queryResponseObject["docs"].length} matches`;

      if (commandName === "searchByTitle") {
        // 各マッチに対して、マッチした内容をパラグラフとしてparentDivに追加します。
        for (let documentIndex = 0; documentIndex < queryResponseObject["docs"].length; documentIndex++) {
          // 各ドキュメントを js オブジェクトとして保存します。
          let queryResponseDocument = queryResponseObject["docs"][documentIndex] as TitleDoc;

          // 著者、タイトル、初版、キーを表しますが、ISBNではありません。
          let matchParagraphString = `<p class="m-0 command-output">
          <span style='color:turquoise'>openLibrary</span>: [${documentIndex + 1}]<br>
          author: ${queryResponseDocument["author_name"]}<br>
          title: ${queryResponseDocument["title"]}<br>
          first published: ${queryResponseDocument["first_publish_year"]}<br>
          key: ${queryResponseDocument["key"]}<br>`;

          // 一致したオブジェクトがキー「isbn」を持っている場合は、isbn情報を含みます。
          if (queryResponseDocument.hasOwnProperty("isbn")) matchParagraphString += `ISBN: ${queryResponseDocument["isbn"][0]} </p>`;
          // そうでなければpタグを閉じます
          else matchParagraphString += `</p>`;

          parentDiv.innerHTML += matchParagraphString;
        }
      }

      if (commandName === "uniqueNameCount") {
        // 各マッチに対して、マッチした内容をパラグラフとしてparentDivに追加します。
        for (let documentIndex = 0; documentIndex < queryResponseObject["docs"].length; documentIndex++) {
          // 各ドキュメントを js オブジェクトとして保存します。
          let queryResponseDocument = queryResponseObject["docs"][documentIndex] as AuthorDoc;

          let matchParagraphString = `<p class="m-0 command-output">
          <span style='color:turquoise'>openLibrary</span>: [${documentIndex + 1}]<br>
          author_name: ${queryResponseDocument["name"]} `;

          matchParagraphString += `</p>`;

          parentDiv.innerHTML += matchParagraphString;
        }
      }

      if (commandName === "titlesByUniqueName") {
        for (let documentIndex = 0; documentIndex < queryResponseObject["docs"].length; documentIndex++) {
          let queryResponseDocument = queryResponseObject["docs"][documentIndex] as AuthorDoc;

          let matchParagraphString = `<p class="m-0 command-output">
          <span style='color:turquoise'>openLibrary</span>: [${documentIndex + 1}]<br>
          author_name: ${queryResponseDocument["name"]}<br>top_work: ${queryResponseDocument["top_work"]} `;

          matchParagraphString += `</p>`;

          parentDiv.innerHTML += matchParagraphString;
        }
      }
    }
    return;
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
        BTools.appendResultParagraph(validatorResponse);
        config.CLIOutputDiv.scrollTop = config.CLIOutputDiv.scrollHeight;
        config.CLITextInput.value = "";
        return;
      }

      let queryString = BTools.queryStringFromParsedCLIArray(parsedCLIArray);
      config.CLIOutputDiv.scrollTop = config.CLIOutputDiv.scrollHeight;

      let queryResponseObject = await BTools.queryResponseObjectFromQueryString(queryString);

      BTools.appendResponseParagraphsFromQueryResponseObject(parsedCLIArray[1], config.CLIOutputDiv, queryResponseObject);
      config.CLIOutputDiv.scrollTop = config.CLIOutputDiv.scrollHeight;
    } else if (event.key === "ArrowUp") {
      Controller.showPrevCommand(commandList);
    } else if (event.key === "ArrowDown") {
      Controller.showNextCommand(commandList);
    }
  }

  public static addCommandToList(commandList: CommandList) {
    if (config.CLITextInput.value === "") return;
    commandList.add(new Command(config.CLITextInput.value));
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

Controller.build();
