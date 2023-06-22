const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//connect to DB
main().catch(err => console.log(err));
async function main() {
  mongoose.set('strictQuery', false);
  // await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB'); local DB
  await mongoose.connect('mongodb+srv://delarakazakova:test123@cluster0.1zumnhc.mongodb.net/todolistDB?retryWrites=true&w=majority');
}



const itemsSchema = new mongoose.Schema({
  name: String,
})

//create new items collection
const Item = new mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome!"
});

const item2 = new Item({
  name: "<- add new item"
});

const item3 = new Item({
  name: "<- delete item"
});

const defaultItems = [item1, item2, item3]

//schema for new routes
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  ///read items from DB
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {  ///check if there are no items
      Item.insertMany(defaultItems, function (err) {
        if (!err) {
          console.log('saved default items');
        }
      })
      res.redirect("/") //if empty go back
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

//creating new lists
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {

        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);

      } else {
        //show existing list
        res.render("list", { listTitle: customListName, newListItems: foundList.items });
      }
    }
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") { //check list
    item.save();
    res.redirect("/"); //to show item
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// delete checked item  from DB
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName; //to check which list

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) { console.log(err.message); }
    });
    res.redirect("/"); //to refresh list
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
      if (!err) { res.redirect("/" + listName); }
    });
  }

});



app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
