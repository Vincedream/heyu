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
