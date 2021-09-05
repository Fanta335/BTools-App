# BTools App

コマンドライン入力を介して、APIからデータを取得・表示するアプリケーションです。  
APIは、書籍のデータが公開されている[Openlibrary API](https://openlibrary.org/dev/docs/api/search)を使用しています。

# URL
https://btools-app.vercel.app/

# Usage
## BTools
MToolsは、シンプルな数学演算を行います。  
コマンド、引数（半角数字）を入力することで演算の結果を得ることができます。
```
$ MTools command argument_1 [argument_2]
```

### Command List
- searchByTitle
- uniqueNameCount
- titlesByUniqueName

<details>
<summary>More command instructions</summary>
<div>

## searchByTitle
本のタイトルを引数として受け取り、タイトルに一致する本のすべての著者名とDBキーのリストを表示します。
  
usage:
```
$ BTools searchByTitle book_title
```

## uniqueNameCount
著者名の一部を引数にとり、その文字列を含む著者を表示します。
  
usage:
```
$ BTools uniqueNameCount author_name_fragment
```

## titlesByUniqueName
著者名の一部を引数として受け取り、その文字列に一致する著者が書いた代表作のタイトルを表示します。
  
usage:
```
$ BTools titlesByUniqueName author_name_fragment
```

</div>
</details>
<br>

# Installation
```
$ git clone https://github.com/Fanta335/BTools-App.git
$ cd BTools-App
```
