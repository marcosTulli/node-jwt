const path = require('path');
const dotenv = path.join(__dirname, 'server', '.env');
require('dotenv').config({ path: dotenv });
const express = require('express');
const chalk = require('chalk');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { uuid } = require('uuidv4');
const {
  getUserByUsername,
  isEmptyObject,
  isPasswordCorrect,
  getAllBooks,
  getAllUsers,
  addBook,
  verifyToken,
  getFavoriteBooksForUser,
  getAudienceFromToken,
  generateToken,
  isCredentialValid,
} = require('./shared');
const constants = require('./constants');
const app = express();
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
app.use(express.json());
// app.use(cors());
app.use(cookieParser());

app.post('/login', (req, res) => {
  let base64Encoding = req.headers.authorization.split(' ')[1];
  const credentials = Buffer.from(base64Encoding, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');
  getUserByUsername(username).then((user) => {
    if (user && !isEmptyObject(user)) {
      console.log(chalk.blue('Received user: ', username));
      isCredentialValid(user.username, password).then((result) => {
        if (!result) {
          res.status(401).send({ msessage: 'username or password is incorrect' });
          console.log(chalk.red('FAILED LOGIN'));
        } else {
          generateToken(null, username).then((token) => {
            console.log(chalk.green('LOGIN OK, user role: ', user.role));
            res.cookie('token', token, { httpOnly: true });
            res.status(200).send({ username: user.username, role: user.role });
          });
        }
      });
    } else res.status(401).send({ message: 'username or password is incorrect' });
  });
});

app.get('/users', verifyToken, (req, res) => {
  console.log(chalk.blue('Requested route to /users '));
  if (getAudienceFromToken(req.cookies.token).includes(constants.SHOW_USERS)) {
    console.log(chalk.blue('Redirecting /users '));
    getAllUsers().then((users) => {
      if (users && users.length > 0) {
        generateToken(req.cookies.token, null).then((token) => {
          console.log(chalk.green('Redirect OK'));
          res.cookie('token', token, { httpOnly: true });
          res.status(200).send({ users: users });
        });
      } else res.status(500).send({ users: [] });
    });
  } else {
    console.log(chalk.red('User not authorized to view users '));
    res.status(403).send({ message: 'Not authorized to view  users' });
  }
});
app.get('/books', verifyToken, (req, res) => {
  console.log(chalk.blue('Requested route to /books '));
  getAllBooks().then((books) => {
    if (books && books.length > 0) {
      generateToken(req.cookies.token, null).then((token) => {
        console.log(chalk.green('Redirecting to  /books '));
        res.cookie('token', token, { httpOnly: true });
        res.status(200).send({ books: books });
      });
    } else {
      console.log(chalk.red('Redirection failed'));
      res.status(500).send({ books: [] });
    }
  });
});

app.get('/favorite', verifyToken, (req, res) => {
  getFavoriteBooksForUser(req.cookies.token).then((books) =>
    generateToken(req.cookies.token, null).then((token) => {
      console.log(chalk.green('Requested favorite books: '));
      console.log(books);
      res.cookie('token', token, { httpOnly: true });
      res.status(200).send({ favorites: books });
    })
  );
});

app.post('/book', verifyToken, (req, res) => {
  if (!req.body.name || !req.body.author) {
    res.status(400).send({ message: 'Invalid Book' });
  } else {
    if (getAudienceFromToken(req.cookies.token).includes(constants.ADD_BOOK)) {
      addBook({ name: req.body.name, author: req.body.author, id: uuid() }).then((err) => {
        if (err) res.status(500).send({ message: 'Cannot add this book' });
        else {
          generateToken(req.cookies.token, null).then((token) => {
            console.log(chalk.green('Book added', req.body.name));
            res.cookie('token', token, { httpOnly: true });
            res.status(200).send({ message: 'Book added succesfully' });
          });
        }
      });
    } else {
      console.log(chalk.red('User not authorized to add book'));
      res.status(403).send({ message: 'Not authorized to add books' });
    }
  }
});

app.get('/logout', verifyToken, (req, res) => {
  console.log(chalk.green('Logged out'));
  res.clearCookie('token');
  res.status(200).send({ message: 'Cookies cleared' });
});

// app.get('/users', verifyToken, (req, res) => {
// const token = req.headers.authorization.split(' ')[1];
// if (getAudienceFromToken(token).includes(Constants.SHOW_USERS)) {
//   getAllUsers().then((users) => {
//     if (users && users.length > 0) {
//       generateToken(token, null).then((token) => {
//         res.status(200).send({ users: users, token: token });
//       });
//     } else res.status(500).send({ users: [], token: token });
//   });
// } else res.status(403).send({ message: 'Not authorized to view users', token: token });
// });

// app.get('/books', verifyToken, (req, res) => {
//   const token = req.headers.authorization.split(' ')[1];
//   getAllBooks().then((books) => {
//     if (books && books.length > 0) {
//       generateToken(token, null).then((token) => {
//         res.status(200).send({ books: books, token: token });
//       });
//     } else res.status(500).send({ books: [], token: token });
//   });
// });

// app.post('/login', (req, res) => {
//   let base64Encoding = req.headers.authorization.split(' ')[1];
//   const credentials = Buffer.from(base64Encoding, 'base64').toString('utf-8');
//   const [username, password] = credentials.split(':');
//   isCredentialValid(username, password).then((result) => {
//     if (!result) res.status(401).send({ message: 'username or password is incorrect' });
//     else res.status(200).send({ user: { username: result.username, role: result.role } });
//   });

// let base64Encoding = req.headers.authorization.split(" ")[1];
// let credentials = Buffer.from(base64Encoding, "base64").toString().split(":");
// const username = credentials[0];
// const password = credentials[1];
// getUserByUsername(username).then((user) => {
//   if (user && !isEmptyObject(user)) {
//     isPasswordCorrect(user.key, password).then((result) => {
//       if (!result)
//         res
//           .status(401)
//           .send({ message: "username or password is incorrect" });
//       else {
//         generateToken(null, username).then((token) => {
//           res
//             .status(200)
//             .send({ username: user.username, role: user.role, token: token });
//         });
//       }
//     });
//   } else
//     res.status(401).send({ message: "username or password is incorrect" });
// });
// });

// app.get('/logout', verifyToken, (req, res) => {
// res.status(200).send({ message: 'Signed out' });
// });

// app.get('/favorite', verifyToken, (req, res) => {
// const token = req.headers.authorization.split(' ')[1];
// getFavoriteBooksForUser(token).then((books) => {
//   generateToken(token, null).then((token) => {
//     res.status(200).send({ favorites: books, token: token });
//   });
// });
// });

// app.post('/book', verifyToken, (req, res) => {
// const token = req.headers.authorization.split(' ')[1];
// if (getAudienceFromToken(token).includes(Constants.ADD_BOOK)) {
//   addBook({ name: req.body.name, author: req.body.author, id: uuid() }).then((err) => {
//     if (err) res.status(500).send({ message: 'Cannot add this book' });
//     else {
//       generateToken(token, null).then((token) => {
//         res.status(200).send({ message: 'Book added successfully', token: token });
//       });
//     }
//   });
// } else res.status(403).send({ message: 'Not authorized to add a book', token: token });
// });
