'use strict'

const dataStorage = require('./file-system')
// const dataStorage = require('./sqlite')
// const dataStorage = require(`./${process.env.npm_lifecycle_event}`)
const { v4: uuidv4 } = require('uuid')
const express = require('express')
const expressEjsLayouts = require("express-ejs-layouts")
const methodOverride = require('method-override')
// const connectFlash = require('connect-flash')
const app = express()
const port = process.env.PORT || 3000

app.set("view engine", "ejs")
app.use(expressEjsLayouts)
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(methodOverride('_method', {
  methods: ['POST', 'GET']
}))
// app.use(connectFlash())

app.get('/name/:name', (req, res) => {
  res.render('index', { name: req.params.name })
})

//ToDo一覧の取得
app.get('/todos', (req, res, next) => {
  //completedがなければ
  if (!req.query.completed) {
    return dataStorage.fetchAll().then(todos => {
      res.render('todos', {todos: todos, completed: ''})
    }, next)
  }
  //completedがある場合の処理
  const completed = req.query.completed === 'true'
  dataStorage.fetchByCompleted(completed).then(todos => res.render('todos', {todos: todos, completed: completed}), next)
}, )

//ToDoの新規登録
app.get('/todos/new', (req, res, next) => res.render('new'))
app.post('/todos/create', (req, res, next) => {
  const title = req.body.title
  const description = req.body.description
  const deadline = req.body.deadline
  if (typeof title !== 'string' || !title) {
    // titleがリクエストに含まれない場合はステータスコード400(Bad Request)
    const err = new Error('title is required')
    err.statusCode = 400
    return next(err)
  }
  const todo = { id: uuidv4(), title, description, deadline, completed: false }
  dataStorage.create(todo).then(() => {
    res.redirect(`/todos/${todo.id}`)}, next)
})

//ToDo詳細の表示
app.get('/todos/:id', (req, res, next) => {
  const id = req.params.id
  dataStorage.fetchById(id).then(todo => res.render('show', { todo:todo }))
})

//ToDoの編集
app.get('/todos/:id/edit', (req, res, next) => {
  const id = req.params.id
  dataStorage.fetchById(id).then(todo => res.render('edit', { todo:todo }))
})
app.put('/todos/:id', (req, res, next) => {
  const id = req.params.id
  const update = { 
    title: req.body.title,
    description: req.body.description,
    deadline: req.body.deadline
  }
  dataStorage.update(id, update).then((todo) => {
    res.redirect(`/todos/${todo.id}`), next})
})
app.put('/todos/:id/completed', (req, res, next) => {
  const id = req.params.id
  const update = { 
    completed: true
  }
  dataStorage.update(id, update).then((todo) => {
    res.redirect(`/todos/${todo.id}`), next})
})
app.delete('/todos/:id/completed', (req, res, next) => {
  const id = req.params.id
  const update = { 
    completed: false
  }
  dataStorage.update(id, update).then((todo) => {
    res.redirect(`/todos/${todo.id}`), next})
})

//ToDoの削除
app.delete('/todos/:id', (req, res, next) => {
  const id = req.params.id
  dataStorage.remove(id).then((id) => res.redirect('/todos'), next)
})

app.get('/', (req, res) => res.render('index'))

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.statusCode || 500).json({ error: err.message })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))