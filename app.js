require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { sendMail } = require("./emailController");
const { config } = require("dotenv");
//use middlewares
app.use(cookieParser());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//set view engine
app.set("view engine", "ejs");
//mongoose

mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
  });


//create schema
const bookingSchema = new mongoose.Schema({
  time: String,
  date: String,
  text: String,
  email: String,
  phoneNumber: String,
  name: String,
});
const adminSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const userSchema = new mongoose.Schema({
  email: String,
  phoneNumber: String,
  name: String,
});
//create model
const Booking = mongoose.model("Booking", bookingSchema);
const Admin = mongoose.model("Admin", adminSchema);
const User = mongoose.model("User", userSchema);

//set static folder
app.use(express.static("public"));

app.post("/api/add-booking", async (req, res) => {
  try {
    const { time, date, text, email, name, phoneNumber } = req.body;

    // Create a new booking
    const booking = new Booking({
      name: name || null,
      time: time || null,
      date: date || null,
      text: text || null,
      email: email || null,
      phoneNumber: phoneNumber || null,
    });

    // Save the booking to the database
    await booking.save();

    // Check if the user already exists
    let user = await User.findOne({ email });

    if (user) {
      console.log("User already exists");
    } else {
      // Create a new user if they don't exist
      user = new User({
        email,
        phoneNumber,
        name,
      });
      await user.save();
      console.log("User created");
    }
    sendMail(
      process.env.EMAIL,
      "New Booking",
      "New Booking",
      `<h1>New Booking</h1><p>Time: ${time}</p><p>Date: ${date}</p><p>Text: ${text}</p><p>Email: ${email}</p><p>Phone Number: ${phoneNumber}</p><p>Name: ${name}</p>`
    );
    res.send("success");
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

app.get("/api/get-booking", (req, res) => {
  if (!req.session.admin) {
    return res
      .status(401)
      .json({ unauthorized: "You are not authorized to access this resource" });
  }

  Booking.find({}, (err, bookings) => {
    if (err) {
      console.log(err);
      res
        .status(500)
        .json({ error: "An error occurred while fetching bookings" });
    } else {
      res.status(200).json(bookings);
    }
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email });

    if (admin) {
      if (admin.password === password) {
        req.session.admin = admin;
        res.cookie("admin", admin);
        res.redirect("/dashboard");
      } else {
        res.send("Wrong password");
      }
    } else {
      res.send("No admin found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

// need to remove
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const admin = await new Admin({
    email,
    password,
  });
  await admin.save();
  res.status(201).json({ message: "admin created" });
});

app.get("/dashboard", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/login");
  }
  Booking.find({}).then((bookings) => {
    res.render("dashboard", { bookings });
  });
});

app.get("/users", async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.status(401).json({
        unauthorized: "You are not authorized to access this resource",
      });
    }
    const users = await User.find({});
    res.render("users", { users });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

app.delete("/api/delete-booking/:id", (req, res) => {
  if (!req.session.admin) {
    return res
      .status(401)
      .json({ unauthorized: "You are not authorized to access this resource" });
  }
  const id = req.params.id;
  Booking.findByIdAndDelete(id, (err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/dashboard");
    }
  });
});
app.get("/api/get-booking/:id", (req, res) => {
  if (!req.session.admin) {
    return res
      .status(401)
      .json({ unauthorized: "You are not authorized to access this resource" });
  }
  const id = req.params.id;
  Booking.findById(id, (err, booking) => {
    if (err) {
      console.log(err);
    } else {
      res.render("edit", { booking });
    }
  });
});

app.listen(3000, () => {
  console.log("server running on port 3000");
});
