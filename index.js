require('dotenv').config();
const express = require("express");
const app = express();
const bcrypt = require('bcrypt');
const User = require("./module/User");
const Order = require("./module/Order");
const bodyParser =require("body-parser");
var jwt = require("jsonwebtoken");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// token generate
const generateAccessToken = (id) => {
    return jwt.sign({ id }, `${process.env.JWT_SECRET_KEY}`);
  };


// authenticate the user
let user_id = "";
const authenticate = async(req , res , next) =>
{
    try{
        let decoded = await jwt.verify(
            // requesting the token from the header to authenticate
            req.headers.authorization,
            process.env.JWT_SECRET_KEY
        );
        // console.log(decoded);
        if (!decoded) {
          return res.send("Unauthenticated User");
        }
        user_id = decoded.id;
        // console.log(user_id)
            next();
        
      } catch (err) {
        //   console.log(err)
        return res.send(err.message);
      }
      
};


// create users
app.post('/Register', async(req,res)=>{
    let {name ,pass} =req.body;
    const saltRounds = 10;
    pass=String(pass);
    let hash=await hashing(pass,saltRounds);
            let data = await new User({name:name ,pass:hash});
            data.save();
            res.send("successfully posted");
})

const hashing=async(pass,salt)=>{
    let hash=await bcrypt.hash(pass,salt) ;
    return hash;   
}

// login
app.post('/login', async (req,res)=>{
    let{name ,pass} = req.body;
    if(name !== "" && pass !== "")
    {
        let data = await User.findOne({name});
        pass=String(pass);
        await bcrypt.compare(pass, data.pass, ((err, result)=> {
            // console.log("data result",result);
            if(result)
            {
                // console.log("data id",data._id);
                let token = generateAccessToken(data._id);
                res.send(token);
            }else{
                res.send("error to find");
            }
        }));   
    }else{
        console.log("not found");
    }
})


// Order Placement
app.post("/order", authenticate ,async(req ,res)=>{
    let { product_name } = req.body;
    let user=user_id;
    let data = await Order({user_id:user , product_name:product_name});
    data.save();
    console.log("sucessfully placed");
    if(data)
    {
        res.send("Product placed sucessfully");
    }else{
        res.send("not");
    }
})


// Get the currently logined user placed order
app.get("/order", authenticate ,async(req ,res)=>{
    let id  = user_id;
    let data = await Order.find({ user_id :id});
    res.json(data);
})


// get the particular order detail from the cart 
app.get("/order/:order_id", authenticate ,async(req,res) =>{
    let user = user_id;
    let id = req.params.order_id;
    let data = await Order.findOne({ _id : id });

    if(user == data.user_id)
    {
        console.log(user)
        if(data)
        {
            console.log(data);
            console.log("successufully get the element");
            res.send(data)
        }
    }else{
        res.send("not created by your id");
    }
})


// port running status
app.listen(8000 , ()=>console.log('Port is running on port 8000'));