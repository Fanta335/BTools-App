"use strict";
const config = {
    CLITextInput: document.getElementById("CLITextInput"),
    CLIOutputDiv: document.getElementById("CLIOutputDiv"),
    url: "https://openlibrary.org/search",
};
// 入力されるコマンドのクラス
class Command {
    constructor(commandInput) {
        this._data = commandInput;
        this._next = undefined;
        this._prev = undefined;
    }
    get data() {
        return this._data;
    }
    set data(stringInput) {
        this._data = stringInput;
    }
    get next() {
        return this._next;
    }
    set next(command) {
        this._next = command;
    }
    get prev() {
        return this._prev;
    }
    set prev(command) {
        this._prev = command;
    }
}
// コマンドを格納する双方向連結リスト
class CommandList {
    constructor() {
        this._head = undefined;
        this._tail = this._head;
        this._iterator = this._tail;
    }
    get head() {
        return this._head;
    }
    get tail() {
        return this._tail;
    }
    get iterator() {
        return this._iterator;
    }
    set iterator(target) {
        this._iterator = target;
    }
    add(newCommand) {
        if (this._tail === undefined) {
            this._head = newCommand;
            this._tail = this._head;
            this._iterator = this._tail;
        }
        else {
            this._tail.next = newCommand;
            newCommand.prev = this._tail;
            newCommand.next = undefined;
            this._tail = newCommand;
            this._iterator = this._tail;
        }
    }
    peekLast() {
        if (this._tail === undefined)
            return undefined;
        return this._tail;
    }
}
class BTools {
    static commandLineParser(CLIInputString) {
        let parsedArray = CLIInputString.trim().split(" ");
        return parsedArray;
    }
    static universalValidator(parsedCLIArray) {
        const commandList = ["searchByTitle", "uniqueNameCount", "topWorkByUniqueName"];
        if (parsedCLIArray[0] !== "BTools") {
            return {
                isValid: false,
                errorMessage: `Invalid input. This app supports only BTools.\nUsage:\n  BTools command_name argument_1 [argument_2]\nCommands:\n  ${commandList.join("\n")}`,
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
        // 各コマンドに応じたバリデーションを実行
        if (parsedCLIArray[1] === "searchByTitle") {
            return BTools.searchByTitleValidator(argsArray);
        }
        if (parsedCLIArray[1] === "uniqueNameCount") {
            return BTools.singleArgValidator("uniqueNameCount", argsArray);
        }
        if (parsedCLIArray[1] === "topWorkByUniqueName") {
            return BTools.singleArgValidator("topWorkByUniqueName", argsArray);
        }
        return { isValid: true, errorMessage: "" };
    }
    static searchByTitleValidator(argsArray) {
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
    static singleArgValidator(commandName, argsArray) {
        if (argsArray.length !== 1)
            return { isValid: false, errorMessage: `Invalid argument. '${commandName}' usage:\nBTools ${commandName} authorNameFragment` };
        return { isValid: true, errorMessage: "" };
    }
    // parseした文字列からクエリ文字列を抽出する
    static queryStringFromParsedCLIArray(parsedCLIArray) {
        let queryString = "";
        if (parsedCLIArray[1] === "searchByTitle") {
            if (parsedCLIArray.length === 3)
                queryString = `.json?title=${parsedCLIArray[2]}`;
            else if (parsedCLIArray.length === 4)
                queryString = `.json?title=${parsedCLIArray[2]}&fields=*,availability&limit=${parsedCLIArray[3]}`;
        }
        if (parsedCLIArray[1] === "uniqueNameCount" || parsedCLIArray[1] === "topWorkByUniqueName") {
            queryString = `/authors.json?q=${parsedCLIArray[2]}`;
        }
        return queryString;
    }
    // クエリを用いてAPIからデータ取得し、オブジェクトを返す
    static async queryResponseObjectFromQueryString(queryString) {
        let queryResponseObject = {
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
    static isIntegerString(arg) {
        let parsedNum = Number(arg);
        return typeof parsedNum === "number" && !isNaN(parsedNum) && parsedNum % 1 === 0;
    }
}
class View {
    static addKeyboardEventListenerToCLI(commandList) {
        config.CLITextInput.addEventListener("keydown", (event) => Controller.submitSearch(event, commandList));
    }
    static appendMirrorParagraph(parentDiv) {
        parentDiv.innerHTML += `
      <p class="m-0 command-output"><span class='user-name'>student</span> <span class='atmark'>@</span> <span class='pc-name'>recursionist</span>: ${config.CLITextInput.value}
      </p>
    `;
        return;
    }
    static appendResultParagraph(validatorResponse) {
        let promptColor = "";
        let promptName = "BTools";
        if (validatorResponse["isValid"]) {
            promptColor = "prompt-success";
        }
        else {
            promptName += "Error";
            promptColor = "prompt-error";
        }
        config.CLIOutputDiv.innerHTML += `
      <p class="m-0">
        <span class='${promptColor}'>${promptName}: </span>
        <span class="command-output">${validatorResponse["errorMessage"]}</span>
      </p>
    `;
        return;
    }
    // APIから取得したオブジェクトを表示する
    static appendResponseParagraphsFromQueryResponseObject(commandName, parentDiv, queryResponseObject) {
        if (queryResponseObject["docs"].length == 0)
            parentDiv.innerHTML += `<p class="m-0 command-output"> <span class='prompt-success'>openLibrary</span>: 0 matches </p>`;
        else {
            parentDiv.innerHTML += `<p class="m-0 command-output"> <span class='prompt-success'>openLibrary</span>: at least ${queryResponseObject["docs"].length} matches`;
            // 各コマンドによる表示の仕分け
            if (commandName === "searchByTitle") {
                View.appendResponseParagraphSearchByTitle(parentDiv, queryResponseObject);
            }
            if (commandName === "uniqueNameCount") {
                View.appendResponseParagraphUniqueNameCount(parentDiv, queryResponseObject);
            }
            if (commandName === "topWorkByUniqueName") {
                View.appendResponseParagraphTopWorkByUniqueName(parentDiv, queryResponseObject);
            }
        }
        return;
    }
    static appendResponseParagraphSearchByTitle(parentDiv, queryResponseObject) {
        for (let documentIndex = 0; documentIndex < queryResponseObject["docs"].length; documentIndex++) {
            let queryResponseDocument = queryResponseObject["docs"][documentIndex];
            let matchParagraphString = `
        <p class="m-0 command-output"><span class='prompt-success'>openLibrary</span>: [${documentIndex + 1}]
        author: ${queryResponseDocument["author_name"]}
        title: ${queryResponseDocument["title"]}
        first published: ${queryResponseDocument["first_publish_year"]}
        key: ${queryResponseDocument["key"]}
      `;
            if (queryResponseDocument.hasOwnProperty("isbn"))
                matchParagraphString += `ISBN: ${queryResponseDocument["isbn"][0]}</p>`;
            else
                matchParagraphString += `</p>`;
            parentDiv.innerHTML += matchParagraphString;
        }
    }
    static appendResponseParagraphUniqueNameCount(parentDiv, queryResponseObject) {
        for (let documentIndex = 0; documentIndex < queryResponseObject["docs"].length; documentIndex++) {
            let queryResponseDocument = queryResponseObject["docs"][documentIndex];
            let matchParagraphString = `
        <p class="m-0 command-output"><span class='prompt-success'>openLibrary</span>: [${documentIndex + 1}]
        author_name: ${queryResponseDocument["name"]}
      `;
            matchParagraphString += `</p>`;
            parentDiv.innerHTML += matchParagraphString;
        }
    }
    static appendResponseParagraphTopWorkByUniqueName(parentDiv, queryResponseObject) {
        for (let documentIndex = 0; documentIndex < queryResponseObject["docs"].length; documentIndex++) {
            let queryResponseDocument = queryResponseObject["docs"][documentIndex];
            let matchParagraphString = `<p class="m-0 command-output"><span class='prompt-success'>openLibrary</span>: [${documentIndex + 1}]
      author_name: ${queryResponseDocument["name"]}
      top_work: ${queryResponseDocument["top_work"]} `;
            matchParagraphString += `</p>`;
            parentDiv.innerHTML += matchParagraphString;
        }
    }
    // 入力したコマンドの履歴へのアクセス
    static showPrevCommand(commandList) {
        if (commandList.iterator === undefined)
            return;
        else {
            config.CLITextInput.value = commandList.iterator.data;
            commandList.iterator = commandList.iterator !== commandList.head ? commandList.iterator.prev : commandList.iterator;
        }
    }
    static showNextCommand(commandList) {
        if (commandList.iterator === undefined)
            return;
        else {
            config.CLITextInput.value = commandList.iterator.data;
            commandList.iterator = commandList.iterator !== commandList.tail ? commandList.iterator.next : commandList.iterator;
        }
    }
}
class Controller {
    static build() {
        let commandList = new CommandList();
        View.addKeyboardEventListenerToCLI(commandList);
    }
    static async submitSearch(event, commandList) {
        if (event.key === "Enter") {
            Controller.addCommandToList(commandList);
            View.appendMirrorParagraph(config.CLIOutputDiv);
            config.CLIOutputDiv.scrollTop = config.CLIOutputDiv.scrollHeight;
            if (config.CLITextInput.value === "")
                return;
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
        }
        else if (event.key === "ArrowUp") {
            View.showPrevCommand(commandList);
        }
        else if (event.key === "ArrowDown") {
            View.showNextCommand(commandList);
        }
    }
    static addCommandToList(commandList) {
        if (config.CLITextInput.value === "")
            return;
        commandList.add(new Command(config.CLITextInput.value));
    }
}
Controller.build();
//# sourceMappingURL=app.js.map