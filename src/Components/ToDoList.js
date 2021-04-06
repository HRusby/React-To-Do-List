import React, { Component } from "react"
import ToDoItem from './ToDoItem'
import NewItem from './NewItem'
import '../css/ToDoList.css'

class ToDoList extends Component {
    constructor(props) {
        super(props)
        this.state = {
            loading: false,
            todos: []
        }
        this.handleChange = this.handleChange.bind(this)
        this.submitSingleItem = this.submitSingleItem.bind(this)
        this.addNewItem = this.addNewItem.bind(this)
        this.removeCompletedItems = this.removeCompletedItems.bind(this)
        this.deleteItem = this.deleteItem.bind(this)
    }

    // Updates the relevant list property and if it's changed updates and submits the state
    handleChange(id, event) {
        const originalItem = this.state.todos.filter((todo) => todo.id === id)[0];
        // Object.assign fine as item doesn't have deep values
        var updatedItem = Object.assign({}, originalItem)
        const { name, checked, value } = event.target

        if (name === "isCompleted") {
            updatedItem.isCompleted = checked
        }
        else if (name === "text") {
            updatedItem.text = value
        }

        if (updatedItem !== originalItem) {
            const updatedTodos = this.state.todos.map((todo) => {
                if (todo.id === id) {
                    return updatedItem
                }
                return todo
            })
            // Submit item after state's been updated
            this.setState(prevState => {
                return {
                    ...prevState,
                    todos: updatedTodos
                }
            }, () => { this.submitSingleItem(id) })
        }
    }

    // Retrieves the specified item from state and submits it to the Api UpdateSpecificListItem endpoint
    submitSingleItem(itemId) {
        const item = this.state.todos.filter((todo) => todo.id === itemId)[0];
        fetch("https://localhost:5001/ToDoList/UpdateSpecificListItem",
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(item)
            }
        )
    }

    // Adds the new item to the database and the Component
    addNewItem(itemText) {
        //Add to Database via API
        fetch("https://localhost:5001/ToDoList/InsertItemForList",
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    listId: this.props.list.listId,
                    userId: 1,
                    text: itemText,
                    isCompleted: false
                })
            })
            .then(response => response.json())
            .then(itemId => this.setState(prevState => {
                return {
                    ...prevState,
                    todos: prevState.todos.concat({
                        id: itemId,
                        text: itemText,
                        isCompleted: false
                    })
                }
            }))
    }

    deleteItem(itemId) {
        const listId = this.props.list.listId
        fetch(
            "https://localhost:5001/ToDoList/DeleteListItem",
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'listId': listId,
                    'itemId': itemId
                })
            })
            .then(resp => resp.json())
            .then(removedRows => this.setState(prevState => {
                return {
                    ...prevState,
                    todos: prevState.todos.filter(todo => todo.id !== itemId)
                }
            }, alert('Deleted ' + removedRows + ' Rows.')))
    }

    // Calls the API and deletes all completed items then clears them down from state
    removeCompletedItems() {
        fetch(
            "https://localhost:5001/ToDoList/RemoveCompletedItemsForList",
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).then(resp => resp.json())
            .then((removedRows) =>
                this.setState(prevState => {
                    const updatedTodos = prevState.todos.filter(todo => todo.isCompleted !== true)
                    return {
                        ...prevState,
                        todos: updatedTodos
                    }
                },
                    alert('Deleted ' + removedRows + ' Rows.')
                )
            )
    }

    // Loads in the list form API and updates the loading state property
    componentDidMount() {
        this.setState(prevState => {
            return { ...prevState, loading: true }
        })

        fetch(
            'https://localhost:5001/ToDoList/GetAllListItemsForListId',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.props.list.listId)
            })
            .then(response => response.json())
            .then(data => this.setState(prevState => { return { ...prevState, loading: false, todos: data } }))
    }

    // Submits all items in state before removing component
    componentWillUnmount() {
        fetch("https://localhost:5001/ToDoList/UpdateListItemSet",
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.state.todos)
            }
        )
    }

    render() {
        const ToDos = this.state.todos
            .sort((x, y) => x.isCompleted - y.isCompleted)
            .map((item) => (
                <ToDoItem
                    key={item.id}
                    item={item}
                    handleChange={this.handleChange}
                    deleteItem={this.deleteItem} />
            ))

        const content = this.state.loading
            ? <p>loading...</p>
            : ToDos

        return (
            <div className="ToDoList">
                <div className='toDoListHeader'>
                    <h1 className='listName'>{this.props.list.listName}</h1>
                    <div className='close' onClick={this.props.closeList} />
                    <i className='removeCompletedItems' onClick={this.removeCompletedItems} value="">
                        Remove Completed Items
                    </i>
                </div>
                <div className='toDoListContent'>
                    {content}
                </div>
                <NewItem addItem={this.addNewItem} placeHolderText="New To Do Item..." />
            </div>)
    }
}

export default ToDoList