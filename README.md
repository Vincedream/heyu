## 何遇

「何遇」是我开发的一款Chorme扩展程序，其主要的功能是当你在 Chorme 浏览器中打开一个新的Tab页面时，空白页会展示出一些有趣的插图、句子、电影截图等，给苦涩的搬砖生活增添一丝乐趣，效果如下：

![image](http://static4.vince.xin/C83A480A-5A9B-433A-9AD0-D2DCA9750491.png)

实现方案很简单，页面就是一个普通的前端页面，配置少许的 `manifest.json` 便可以直接转换为 Chorme 扩展程序，而后端服务是一个 HTTP 接口，返回页面展示的内容，该接口使用了阿里云的 Faas 服务，是一种 Serverless 概念的实现方式，总之该接口无须部署在自己的服务器上，而是直接放在阿里云平台上，具体见下文。

假如你科学上网，便可以访问该 [链接](https://chrome.google.com/webstore/detail/%E4%BD%95%E9%81%87/bliibihaohjjohhclajiakpmomocnael) 下载体验，或者在 [应用市场](https://chrome.google.com/webstore/category/extensions?h1=zh) 搜索“何遇”下载。

项目前后端源代码已经上传到 Github ，欢迎一起交流，传送门： [heyu](https://github.com/Vincedream/heyu)

## 什么是 Serverless

### 简单介绍

Serverless 是最近一个非常火热的话题，在文章的开始，我们必须澄清 Serverless 并不是按照字面理解上的“无服务器”，其准确含义是表示对于开发者而言，不再需要关注大部分与服务器相关的事物，比如服务器的选购、服务器系统环境、日志收集、系统监控、负载均衡等琐事，这些重复且复杂的活都交给 Serverless 平台即可，开发者只需要专注业务逻辑的开发。

### 初识 Serverless

最早接触到 Serverless 概念时，是在我2017年大二暑假，那时候需要实现一个招聘类的小程序，当时苦于后端经验不足，只会写一些简单 CURD 的 java 代码，而对于服务的部署、域名解析、https 证书部署、日志、监控、负载均衡等知识了解甚微，当我快要放弃时，遇到了当时国内最早一批 Serverless 服务商 [leancloud](https://leancloud.cn/)，leancloud 提供一套完整的小程序后端解决方案，只需要在平台上建立数据库，便可以直接在前端操控 API 来对数据库进行 curd 操作，其他的一切都不需要操心，除了小程序外，leancloud 还提供 APP 上类似的服务，在我结识的一些独立开发者，已经有一部分项目已经完全使用该服务，其便捷性和稳定性已经得到大家的认可，当然，需要切身体验才能确定其是否真正适合你所开发的业务。

这是我开源的一个使用 Serverless 概念开发的微信小程序：[基于LeanCloud为后端的 “云校招” 微信小程序](https://github.com/Vincedream/cloud-job)，假如你是一个不熟悉后端的前端开发者，却又想开发一个完整的项目，可以参考该项目。

### 分类

Serverless应用可以细分为BaaS和FaaS两类：

- **BaaS**: Backend as a Service，这里的Backend可以指代任何第三方提供的应用和服务，比如提供云数据库服务的Firebase和Parse，提供统一用户身份验证服务的Auth0和Amazon Cognito等。

- **FaaS**: Functions as a Service，应用以函数的形式存在，并由第三方云平台托管运行，比如之前提到的Amazon Lambda，Google Cloud Functions等。

本篇实战，主要用到了阿里云提供的 FaaS 服务，并且大部分内容都是围绕者 FaaS 来论述。

## Serverless 的优势在哪

除了上述说到的“无需运维”的优势外，Serverless 还有哪些优势值得我们去实践呢？

### 按需付费成本低

每一个 Faas 只会在触发的情况下，才会进行计费，而不是像传统部署在服务器上的服务无时无刻都在收费。Faas的费用由调用次数费用、执行时间决定的，简单来说，一个函数执行设置内存为128MB，执行时间是200ms，则一次执行所消耗的资源为 0.128GB * 0.2s = 0.0256GB-S,假设调用了100万次，只消耗大概4元人民币，因此换算过来，假如一个用户每天调用20次该函数，你有5万活跃用户，则该函数一天只需要4元人民币的成本。

详情：[计费计算器](http://g.alicdn.com/aliyun-next/fc/1.1.69/price.html?spm=a2c4g.11186623.2.20.1de85819nC9NHy)

### 弹性伸缩

当该 Faas 触发频率猛增的时候，服务商能够毫秒级别弹性伸缩，快速实现底层扩容以应对峰值压力，提升了服务在特殊情况下的稳定性。

### 事件驱动

上文我们说到的 Faas 触发，那么怎样触发一个 Faas 呢？阿里云的 Faas 提供了多种触发器，如HTPP触发器、对象存储触发器、日志服务触发器、定时触发器等，这里的便捷在于：假如你使用了大部分阿里云的其他云服务，这些服务便能与 Faas 无缝对接。

## 开始做一个简单的 Faas（函数计算）

### Hello Word Demo

我们先来实现一个简单的 Faas，使用HTTP触发器，当我向一个接口发送请求后，返回一个"hello word"字段。

访问阿里云 [Faas](https://www.aliyun.com/product/fc) 当用户第一次使用阿里云 Faas 时，需要开通一系列的服务，当然都是免费的，开通函数计算(Faas)服务后，便可以在控制台中新建函数。

1. 选择函数模版，这里我们选择NodeJs8

![image](http://static4.vince.xin/2C368E7F-B942-4C5A-9C34-7627E5E8833C.png)

2. 选择函数触发器，这里我们选择HTTP触发器，认证方式这里我们先用不到，选择anonymous。

![image](http://static4.vince.xin/9486E289-826F-4BD0-801F-315270F57D1C.png)

3. 编写 Faas 函数

![image](http://static4.vince.xin/B10412B3-3993-4667-94B8-2A7D9B218778.png)

这里的函数的代码如下：


```
module.exports.handler = function(req, resp, context) {
    console.log('hello world');
    var params = {
        path: req.path,
        queries: req.queries,
        headers: req.headers,
        method : req.method,
        requestURI : req.url,
        clientIP : req.clientIP,
    }
    console.log(params);
    resp.send(JSON.stringify({content: 'hello word'}));
}
```

这里我们通过req来获取请求信息，resp用来返回数据，context 可以获取到函数上下文。

4. 权限选择，这里我们先不选择，因为没用用到与权限相关的功能。

5. 调用函数，创建完函数后，对于HTTP为触发器的 Faas，会默认一个url来调用该函数，当然，也可以指定域名和路径。

![image](http://static4.vince.xin/377BA949-3CB6-4C1D-BC74-45DBCF9A7320.png)

这里，我们只需要几步，就完成了一个公网下可以调用的api，试想，我们还能用 Faas 做些什么呢，能不能做一些复杂的逻辑，比如爬取某个网站上的数据，将数据放入body返回给调用者。

### 爬虫服务

之前我写过一篇关于爬虫的博客，使用现有的轮子实现起来也很简单，具体见我另外一篇博客 [NodeMail](https://github.com/Vincedream/NodeMail)，我们以实现一个获取随机获取One上的每日推荐函数为例，创建一个含有自定义包的 Faas 函数。

**遇到的问题：** 我们上面的 demo 中，没有用到任何外部 npm 包，为了实现该需求，我们需要调用 npm 上的包，因此，在 Faas 平台上无法在线编辑，这时需要在本地创建一个 node 项目，安装所需要的包，编写业务代码，具体步骤：

1. 在pc本地创建一个文件夹`FaasTest`，初始化项目，然后使用npm或者yarn安装所需包


```
npm init
npm i superagent cheerio moment
```

2. 创建`index.js`，编写爬虫代码

```
const superagent = require("superagent"); // 发送网络请求获取DOM
const cheerio = require("cheerio"); // 能够像Jquery一样方便获取DOM节点
const moment = require("moment"); // 

function getOneContent() {
    return new Promise(function(resolve, reject) {
        let min = 1800;
        let max = moment().diff(moment("2017-08-14"), 'days') + 1800; // 获取2017-08-14开始的内容
        let target = Math.floor(Math.random()*(max-min+1)+min); // 获取随机数
        superagent.get(`http://wufazhuce.com/one/${target}`).end(function(err, res) {
            if (err) {
                console.log(err);
            }
            let $ = cheerio.load(res.text);
            let selectItem = $("#main-container .tab-content")[0];
            let data = {
                imgUrl: $(selectItem).find('.one-imagen img').attr("src"),
                tag: $(selectItem).find('.one-imagen-footer .one-imagen-leyenda').text().replace(/(^\s*)|(\s*$)/g, ""),
                content: $(selectItem).find('.one-cita-wrapper .one-cita').text().replace(/(^\s*)|(\s*$)/g, ""),
            }
            resolve(data);
        });
    })
}

getOneContent().then(res=>{
    console.log(res)
})
```

我们可以在本地测试该项目，再改造成 Faas 需要的代码规范。

3. 改造为 Faas 规范

我们从第一个 hello word 的 demo 中看到，以HTTP为触发器的 Faas 函数有以下代码包裹着：


```
module.exports.handler = function(req, resp, context) {
    // other code
}
```

使用 resp 来返回爬取的数据，改造后的代码如下：

```
const superagent = require("superagent"); //发送网络请求获取DOM
const cheerio = require("cheerio"); //能够像Jquery一样方便获取DOM节点
const moment = require("moment");
module.exports.handler = function(req, resp, context) {
  getOneContent().then(res=>{
      resp.send(JSON.stringify(res));
  })
}
function getOneContent() {
    return new Promise(function(resolve, reject) {
        let min = 1800;
        let max = moment().diff(moment("2017-08-14"), 'days') + 1800;
        let target = Math.floor(Math.random()*(max-min+1)+min);
        superagent.get(`http://wufazhuce.com/one/${target}`).end(function(err, res) {
            if (err) {
                console.log(err);
            }
            let $ = cheerio.load(res.text);

            let selectItem = $("#main-container .tab-content")[0];
            let data = {
                imgUrl: $(selectItem).find('.one-imagen img').attr("src"),
                tag: $(selectItem).find('.one-imagen-footer .one-imagen-leyenda').text().replace(/(^\s*)|(\s*$)/g, ""),
                content: $(selectItem).find('.one-cita-wrapper .one-cita').text().replace(/(^\s*)|(\s*$)/g, ""),
            }
            resolve(data);
        });
    })
}
```

以上代码已经上传到 Github ，传送门：[Faas](https://github.com/Vincedream/heyu/tree/master/Faas)

4. 使用 fcli 将项目部署到 Faas 平台

这一步原本可以直接打包成 zip 进行代码包上传，但是在我的本地系统下会出 bug，文档中有另外一种方法，使用阿里云的 Faas shell 工具: [fcli](https://help.aliyun.com/document_detail/52995.html).

下载 fcli 初始化后，进入 fcli 所在目录，输入 `./fcli shell` 进入交互模式，输入 `ls` 查看服务列表，进入列表 `cd xxx`，更新函数的代码包：

```
upf hello -d /Users/vince/Desktop/FaasTes
```

- **upf hello** ：更新 hello 函数
- **-d /Users/vince/Desktop/FaasTes**：-d 表示需要上传代码包所在的目录

5. 测试接口，使用 postman 测试接口，简单的后端服务即完成。

## 开发一个简单的 Chorme 扩展程序

Chorme 扩展程序并不是什么新奇的技术，简单来说就是一个 web 应用，根据 Chorme 扩展程序的规范，按照给出的接口定制开发部分代码，更改一些配置，这里有一篇很好的指南推荐给大家[《Chrome插件开发全攻略》](https://github.com/sxei/chrome-plugin-demo)。

### 需求描述

具体需求是每次打开一个新的 tab，都展示一个 web 页面，web 页面上的内容从 Faas 中获取，为了优化体验，保证每次打开 Tab 页面能马上展示内容，这里我们提前将获取到的内容保存在 localStorage 供下次展示，因此我们每次看到的内容其实是上一次获取到的，这样就能保证内容能立即现实。

### 具体实现

#### 逻辑实现

这里我们选用 React 简单创建一个项目，在 `App.js` 中编写以下代码：

```
import React from 'react'
import axios from 'axios'
import './App.scss'

// 第一次运行时，加载初始内容
const initData = {
  imgUrl: 'http://image.wufazhuce.com/Fj7Xcw1A0EICyyVSYDnU7FEL8l3H',
  tag: '插画',
  content: '喜欢和讨厌是自己无法选择的，所以一旦喜欢上了，不管你是什么样子，我都喜欢你。',
}
class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      content: null,
    }
  }

  componentDidMount() {
    // 假如localStorage中无数据，则加载initData
    const data = localStorage.getItem('content') ? JSON.parse(localStorage.getItem('content')) : initData
    this.setState({
      content: data,
    })
    this.getContentAndSave()
  }

  getContentAndSave() {
    axios({
      method: 'get',
      url: 'https://1556981199176880.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/test/hello/',
    }).then((res) => {
      // 保存数据到localStorage
      localStorage.setItem('content', JSON.stringify(res.data))
      // 预加载img
      if (res.data.imgUrl) {
        const img = new Image()
        img.src = res.data.imgUrl
      }
    })
  }

  render() {
    const { content } = this.state
    return (
      <div className="app">
        <If condition={content}>
          <div className="content">
            <img src={content.imgUrl} alt="" />
            <div className="tag">{content.tag}</div>
            <div className="slogan">{content.content}</div>
          </div>
        </If>
      </div>
    )
  }
}

export default App

```

这里只是一个简单的 web 应用，那么如何将其转换为 Chorme 拓展程序呢？

#### 转换为 Chorme 拓展程序

首先，我们将该 React 项目 build 后，在 dist 文件下添加一系列文件，这里有个关键的文件 `manifest.json`，这里描述的是Chorme 拓展程序的信息：


```
{
	"manifest_version": 2,
	"name": "heyu",
	"version": "1.0",
	"description": "每一次的New Tab，都是一场最美好的相遇。",
	"author": "vince",
	"omnibox": { "keyword" : "heyu" },
	"icons":
	{
		"48": "icon.png",
		"128": "icon.png"
	},
	"background": {
		"scripts": ["background.js"],
		"persistent": false
	},
	"browser_action": 
	{
		"default_icon": "icon.png"
	},
	"chrome_url_overrides":
	{
		"newtab": "index.html"
	}
}
```

我们来讲解一下该项目中比较重要的几个参数

- **chrome_url_overrides**： 表示覆盖特定页面，使用override页可以将Chrome默认的一些特定页面替换掉，改为使用扩展提供的页面，这里我们就使用打包后的主页 `index.html`。

- **background**：后台，，它随着浏览器的打开而打开，随着浏览器的关闭而关闭，这里我们使用到了`scripts`参数，表示打开页面时即运行`background.js`脚本：

```
chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({ 'url': 'chrome://newtab' })
})
```

该段代码表示当触发 browserAction 时，打开一个 newtab 页面，那么怎样触发 browserAction 呢？也就是当你下载该拓展程序后，在浏览器右上角点击该 icon 时，即触发 browserAction 事件。

![image](http://static4.vince.xin/BC15E58B-16B0-4CFF-9BBE-06B86631B260.png)

其他的配置具体表示什么，在我上面分享的开发指南中有具体讲解。

现在我们 dist 文件夹下有以下文件：


```
├── background.js
├── favicon.ico
├── icon.png
├── index.html
├── js
│   └── bundle.js
└── manifest.json
```

以上源码已经上传到 Github ，传送门： [ChormeExtension](https://github.com/Vincedream/heyu/tree/master/ChormeExtension)


#### 测试拓展程序

一切就绪后，我们打开网页，输入 `chrome://extensions/`，右上角开启开发者模式，直接拖入 `dist` 文件夹自动安装拓展程序。

试试打开一个新的 Tab 页面后，展现了我们开发的 web 页，或者我们直接点击右上角的 icon ，也能打开一个新的页面。


## 总结

对于 Serverless ，本篇文章所讲解的实践只是其很小的一部分，对于 Faas ，我们还能用它来实现更多业务场景，比如部署定时任务、图片处理(转码、水印)、音频转换、文字处理等“一次性”的计算，这类计算往往不需要复杂的鉴权操作，功能单一，无状态，非常适合将其完全剥离出来，单独进行维护与部署。
