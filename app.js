require('dotenv').config();
const express=require('express');
const app = express();
const mongoose = require('mongoose');
const { test } = require('node:test');
const _=require('lodash');

app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

const mDBconnection= process.env.dbConnect;

mongoose.connect(mDBconnection);    

const itemSchema = new  mongoose.Schema({work: String});
const Item = mongoose.model("Todos", itemSchema);

const item1 =new Item({
    work:"Welcome to your todolist"
});

const item2 =new Item({
    work:"you can add task to the list by clicking + button"
});

const item3 =new Item({
    work:"you can remove tasks from the list via the checkbox"
});


const defaultList = [item1, item2, item3];

const listSchema = new mongoose.Schema({name: String, items: [itemSchema]});

const List = mongoose.model("List", listSchema);


app.get('/', function(req, res) {
    Item.find({})
        .then(function(foundItems){
            if(foundItems.length===0){
                Item.insertMany(defaultList)
                .then( function(){
                    console.log("Saved default items to DB");
                })
                .catch( err => console.log(err));

                res.redirect('/');
            }else{
                console.log("imported data already");
                res.render('list',{listTitle:"Home", newListItem: foundItems});
            }
        })
        .catch(err => {console.log(err);});     
})

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name:customListName}).then(function(foundList){
        if(foundList){
            console.log("found");
            res.render('list',{listTitle: foundList.name , newListItem: foundList.items});
        }else{
            console.log("not found");
            const list = new List({
                name: customListName,
                items: defaultList
            })
            list.save();
            res.redirect('/'+customListName);
        }

    }).catch(err =>console.log(err));

                                                    
})

app.post("/", function(req, res) {
    let item= req.body.newItem;
    let listTitle=req.body.list;

    const todo =new Item({
        work: item
    });

    if(listTitle=="Home") {
        todo.save();
        res.redirect('/');
    }else{
        List.findOne({name: listTitle}).then(function(foundList){
            foundList.items.push(todo);
            foundList.save();
            res.redirect('/'+listTitle);
        }).catch(err=>{console.log(err)});
    }
})

app.post("/delete", function(req,res){
    let checkedID=req.body.checkbox;
    let listName = req.body.listName;

    if(listName=="Home"){
        Item.findByIdAndRemove(checkedID)
        .then(function(){
            console.log("removed");
            res.redirect('/');
        })
        .catch(function(err){
            console.log(err);
        })
    
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items:{_id: checkedID}}})
        .then(function(){
            res.redirect("/"+listName);
        })
        .catch(err=>console.log(err));
    }



})




app.listen(3000, function(){
    console.log('listening on port 3000');
})