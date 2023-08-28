const jsonfile = require('jsonfile');
const bcrypt = require('bcrypt');
const path = require('path');
const { json } = require('express');
const users = path.join(__dirname, 'database', 'users.json');
const inventory = path.join(__dirname, 'database', 'books.json');
const constants = require('./constants');
const jwt = require('jsonwebtoken');
const chalk = require('chalk');

const getUserByUsername = async function (username) {
  try {
    const allUsers = await jsonfile.readFile(users);
    const filteredUserArray = allUsers.filter((user) => user.username === username);
    return filteredUserArray.length === 0 ? {} : filteredUserArray[0];
  } catch (err) {
    console.log('Error reading users: ', err.message);
  }
};

exports.getUserByUsername = async function (username) {
  try {
    const allUsers = await jsonfile.readFile(users);
    const filteredUserArray = allUsers.filter((user) => user.username === username);
    return filteredUserArray.length === 0 ? {} : filteredUserArray[0];
  } catch (err) {
    console.log('Error reading users: ', err.message);
  }
};

exports.isCredentialValid = async function (username, password) {
  const user = await getUserByUsername(username);
  if (user) {
    return bcrypt.compare(password, user.key).then((result) => (result ? user : result));
  } else return false;
};

exports.isEmptyObject = (object) => Object.entries(object).length === 0;

exports.getAllBooks = async function () {
  try {
    return await jsonfile.readFile(inventory);
  } catch (err) {
    console.log('Error reading books: ', err);
  }
};

exports.getAllUsers = async function () {
  try {
    const allUsers = await jsonfile.readFile(users);
    let updatedUsers = [];
    allUsers.forEach((user) => {
      updatedUsers.push({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    });
    return updatedUsers;
  } catch (error) {
    console.log('Error getting users: ', error);
  }
};

exports.addBook = async function (book) {
  try {
    const allBooks = await jsonfile.readFile(inventory);
    allBooks.push(book);
    return await jsonfile.writeFile(inventory, allBooks);
  } catch (err) {
    return err;
  }
};

const getUsernameFromToken = (token) => jwt.decode(token)['sub'];

exports.generateToken = async function (prevToken, userName) {
  const name = userName || getUsernameFromToken(prevToken);
  const user = await getUserByUsername(name);
  const options = {
    algorithm: constants.ALGORITHM,
    expiresIn: constants.EXPIRY,
    issuer: constants.ISSUER,
    subject: userName || user.username,
    audience:
      user.role === 'admin' ? constants.JWT_OPTIONS.ADMIN_AUDIENCE : constants.JWT_OPTIONS.MEMBER_AUDIENCE,
  };
  return jwt.sign({}, constants.SECRET, options);
};

exports.verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) res.status(401).send({ message: 'Not authroized to access data' });
  else {
    jwt.verify(token, constants.SECRET, function (err) {
      if (err) {
        res.clearCookie('token');
        res.status(401).send({ message: 'Please try again' });
      } else next();
    });
  }
};

exports.isPasswordCorrect = async function (key, password) {
  return bcrypt.compare(password, key).then((result) => result);
};

exports.getAudienceFromToken = (token) => jwt.decode(token)['aud'];

exports.getFavoriteBooksForUser = async function (token) {
  const username = getUsernameFromToken(token);
  const user = await getUserByUsername(username);
  const favoriteBookIds = user['favorite'];
  const favoriteBooks = [];
  if (favoriteBookIds.length === 0) return favoriteBooks;
  const allBooks = await jsonfile.readFile(inventory);
  favoriteBookIds.forEach((id) => favoriteBooks.push(allBooks.filter((book) => id === book.id)[0]));
  return favoriteBooks;
};

// const jsonfile = require("jsonfile");
// const users = "./database/users.json";
// const inventory = "./database/books.json"; //
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const Constants = require("./constants");

// var getUserByUsername = (exports.getUserByUsername = async function (username) {
//   try {
//     const allUsers = await jsonfile.readFile(users);
//     const filteredUserArray = allUsers.filter(
//       (user) => user.username === username
//     );
//     return filteredUserArray.length === 0 ? {} : filteredUserArray[0];
//   } catch (err) {
//     console.log("Error reading users: ", err.message);
//   }
// });

// exports.isEmptyObject = (object) => Object.entries(object).length === 0;

// exports.isPasswordCorrect = async function (key, password) {
//   return bcrypt.compare(password, key).then((result) => result);
// };

// exports.getAllBooks = async function () {
//   try {
//     return await jsonfile.readFile(inventory);
//   } catch (err) {
//     console.log("Error reading books: ", err);
//   }
// };

// exports.getAllUsers = async function () {
//   try {
//     const allUsers = await jsonfile.readFile(users);
//     let updatedUsers = []; { }
//     allUsers.forEach((user) => {
//       updatedUsers.push({
//         username: user.username,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         role: user.role,
//       });
//     });
//     return updatedUsers;
//   } catch (err) {
//     console.log("Error reading users from datastore ", err.message);
//   }
// };

// exports.addBook = async function (book) {
//   try {
//     const allBooks = await jsonfile.readFile(inventory);
//     allBooks.push(book);
//     return await jsonfile.writeFile(inventory, allBooks);
//   } catch (err) {
//     return err;
//   }
// };

// const getUsernameFromToken = (token) => jwt.decode(token)["sub"];

// exports.getAudienceFromToken = (token) => jwt.decode(token)["aud"];

// exports.generateToken = async function (prevToken, userName) {
//   const name = userName || getUsernameFromToken(prevToken);
//   const user = await getUserByUsername(name);
//   const options = {
//     algorithm: process.env.ALGORITHM,
//     expiresIn: process.env.EXPIRY,
//     issuer: process.env.ISSUER,
//     subject: userName || user.username,
//     audience:
//       user.role === "admin"
//         ? Constants.JWT_OPTIONS.ADMIN_AUDIENCE
//         : Constants.JWT_OPTIONS.MEMBER_AUDIENCE,
//   };
//   return jwt.sign({}, process.env.SECRET, options);
// };

// exports.verifyToken = (req, res, next) => {
//   if (!req.headers.authorization)
//     res.status(401).send({ message: "Not authorized to access data" });
//   else {
//     const token = req.headers.authorization.split(" ")[1];
//     if (!token)
//       res.status(401).send({ message: "Not Authorized to access data" });
//     else {
//       jwt.verify(token, process.env.SECRET, function (err) {
//         if (err) {
//           res.status(401).send({ message: "Please login again" });
//         } else next();
//       });
//     }
//   }
// };

// exports.getFavoriteBooksForUser = async function (token) {
//   const username = getUsernameFromToken(token);
//   const user = await getUserByUsername(username);
//   const favoriteBookIds = user["favorite"];
//   const favoriteBooks = [];
//   if (favoriteBookIds.length === 0) return favoriteBooks;
//   const allBooks = await jsonfile.readFile(inventory);
//   favoriteBookIds.forEach((id) =>
//     favoriteBooks.push(allBooks.filter((book) => id === book.id)[0])
//   );
//   return favoriteBooks;
// };
