"use strict";
const config = {
    CLITextInput: document.getElementById("CLITextInput"),
    CLIOutputDiv: document.getElementById("CLIOutputDiv"),
    url: "https://openlibrary.org/search.json?",
};
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
        let parsedArray = CLIInputString.split(" ");
        return parsedArray;
    }
    static universalValidator(parsedCLIArray) {
        const commandList = ["searchByTitle", "uniqueNameCount", "titlesByUniqueName"];
        // blank input is ok
        if (parsedCLIArray[0] === "")
            return { isValid: true, errorMessage: "" };
        if (parsedCLIArray[0] !== "BTools") {
            return {
                isValid: false,
                errorMessage: `This app supports only BTools.\nUsage:\n  BTools command_name argument_1 [argument_2]\nCommands:\n  ${commandList.join("\n")}`,
            };
        }
        if (commandList.indexOf(parsedCLIArray[1]) === -1) {
            return { isValid: false, errorMessage: `BTools supports only following commands:\n${commandList.join("\n")}` };
        }
        let argsArray = parsedCLIArray.slice(2, parsedCLIArray.length);
        // validators for each command
        if (argsArray[1] === "searchByTitle") {
            BTools.searchByTitleValidator(argsArray);
        }
        if (argsArray[1] === "uniqueNameCount") {
            BTools.singleArgValidator("uniqueNameCount", argsArray);
        }
        if (argsArray[1] === "titlesByUniqueName") {
            BTools.singleArgValidator("titlesByUniqueName", argsArray);
        }
        return { isValid: true, errorMessage: "" };
    }
    static searchByTitleValidator(argsArray) {
        if (argsArray.length !== 1 && argsArray.length !== 2) {
            return {
                isValid: false,
                errorMessage: `'searchByTitle' usage is like following:\n'BTools searchByTitle bookTitle [maximumNumberOfResults]'`,
            };
        }
        // validation for searchByTitle [bookTitle] [maximumNumberOfResults]
        if (argsArray.length === 2) {
            if (!BTools.isNumericString(argsArray[1])) {
                return { isValid: false, errorMessage: `last element should contain only number` };
            }
            if (BTools.isNumericString(argsArray[1]) && Number(argsArray[1]) < 1) {
                return { isValid: false, errorMessage: `last element should contain number > 1` };
            }
        }
        return { isValid: true, errorMessage: "" };
    }
    static singleArgValidator(commandName, argsArray) {
        if (argsArray.length !== 1)
            return { isValid: false, errorMessage: `command '${commandName}' requires exactly 1 argument` };
        if (commandName === "uniqueNameCount") {
        }
        if (commandName === "titlesByUniqueName") {
        }
        return { isValid: true, errorMessage: "" };
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
        <span class='${promptColor}'>${promptName}: </span><br>
        <span class="command-output">${validatorResponse["errorMessage"]}</span>
      </p><br>
    `;
        return;
    }
    static queryStringFromParsedCLIArray(parsedCLIArray) {
        let queryString = "";
        if (parsedCLIArray[0] === "searchByTitle") {
            if (parsedCLIArray.length === 3)
                queryString = `title=${parsedCLIArray[2]}`;
            else if (parsedCLIArray.length === 4)
                queryString = `title=${parsedCLIArray[2]}&fields=*,availability&limit=${parsedCLIArray[3]}`;
        }
        if (parsedCLIArray[0] === "uniqueNameCount" || parsedCLIArray[0] === "titlesByUniqueName") {
            queryString = `author=${parsedCLIArray[2]}`;
        }
        return queryString;
    }
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
    static appendResponseParagraphsFromQueryResponseObject(parentDiv, queryResponseObject) {
        console.log(queryResponseObject);
        // 一致するものがない場合は、その旨のメッセージをレンダリングします。
        if (queryResponseObject["docs"].length == 0)
            parentDiv.innerHTML += `<p class="m-0"> <span style='color:turquoise'>openLibrary</span>: 0 matches </p>`;
        // 一致するものがあれば、それぞれを繰り返し処理し、著者、タイトル、最初の出版年、オブジェクトキー、ISBNを表示する段落を追加します。
        else {
            // 一致した数を表示
            parentDiv.innerHTML += `<p class="m-0"> <span style='color:turquoise'>openLibrary</span>: at least ${queryResponseObject["docs"].length} matches`;
            // 各マッチに対して、マッチした内容をパラグラフとしてparentDivに追加します。
            for (let documentIndex = 0; documentIndex < queryResponseObject["docs"].length; documentIndex++) {
                // 各ドキュメントを js オブジェクトとして保存します。
                let queryResponseDocument = queryResponseObject["docs"][documentIndex];
                // 著者、タイトル、初版、キーを表しますが、ISBNではありません。
                let matchParagraphString = `<p class="m-0">
                <span style='color:turquoise'>openLibrary</span>: [${documentIndex + 1}]
                author: ${queryResponseDocument["author_name"]},
                title: ${queryResponseDocument["title"]},
                first published: ${queryResponseDocument["first_publish_year"]},
                key: ${queryResponseDocument["key"]}, `;
                // 一致したオブジェクトがキー「isbn」を持っている場合は、isbn情報を含みます。
                if (queryResponseDocument.hasOwnProperty("isbn"))
                    matchParagraphString += `ISBN: ${queryResponseDocument["isbn"][0]} </p>`;
                // そうでなければpタグを閉じます
                else
                    matchParagraphString += `</p>`;
                parentDiv.innerHTML += matchParagraphString;
            }
        }
        return;
    }
    static isNumericString(arg) {
        let parsedNum = Number(arg);
        return typeof parsedNum === "number" && !isNaN(parsedNum);
    }
}
class View {
    static addKeyboardEventListenerToCLI(commandList) {
        config.CLITextInput.addEventListener("keydown", (event) => Controller.submitSearch(event, commandList));
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
            let parsedCLIArray = BTools.commandLineParser(config.CLITextInput.value);
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
            BTools.appendResponseParagraphsFromQueryResponseObject(config.CLIOutputDiv, queryResponseObject);
            config.CLIOutputDiv.scrollTop = config.CLIOutputDiv.scrollHeight;
        }
        else if (event.key === "ArrowUp") {
            Controller.showPrevCommand(commandList);
        }
        else if (event.key === "ArrowDown") {
            Controller.showNextCommand(commandList);
        }
    }
    static addCommandToList(commandList) {
        if (config.CLITextInput.value === "")
            return;
        commandList.add(new Command(config.CLITextInput.value));
    }
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
Controller.build();
//# sourceMappingURL=app.js.map