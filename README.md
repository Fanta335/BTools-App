# BTools App

コマンドライン入力を介して、APIからデータを取得・表示するアプリケーションです。  
APIは、書籍のデータが公開されている[Openlibrary API](https://openlibrary.org/dev/docs/api/search)を使用しています。

# URL
https://btools-app.vercel.app/

# Usage
## BTools
BToolsは、Openlibrary APIにリクエストを送信することで、本を検索することができます。  
コマンド、引数を入力することで検索の結果を得ることができます。  
usage:
```
$ BTools command argument_1 [argument_2]
```

### Command List
- searchByTitle
- uniqueNameCount
- topWorkByUniqueName

<details>
<summary>More command instructions</summary>
<div>

## searchByTitle
本のタイトルを引数として受け取り、タイトルに一致する本のすべての著者名とDBキーのリストを表示します。  
また、本のタイトルに加えて1-100までの整数を引数にわたすことで、表示する数を指定することができます。
  
usage:
```
$ BTools searchByTitle book_title [maximumNumberOfResults]
```
本のタイトルは、'+'を用いることで複数の単語で検索することもできます。
  
e.g.
```
$ BTools searchByTitle the+lord+of+the+rings 1
$ openLibrary: at least 1 matches
$ openLibrary: [1]
author: J.R.R. Tolkien
title: The Lord of the Rings
first published: 1950
key: /works/OL27448W
ISBN: 9780007124015

```

## uniqueNameCount
著者名の一部を引数にとり、その文字列を含む著者のリストを表示します。
  
usage:
```
$ BTools uniqueNameCount author_name_fragment
```

## topWorkByUniqueName
著者名の一部を引数として受け取り、その文字列に一致する著者と、その代表作のタイトルのリストを表示します。
  
usage:
```
$ BTools topWorkByUniqueName author_name_fragment
```

</div>
</details>

# Installation
```
$ git clone https://github.com/Fanta335/BTools-App.git
$ cd BTools-App
```
