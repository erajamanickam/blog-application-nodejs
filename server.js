const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret-key',
  resave: true,
  saveUninitialized: true
}));

app.use('/public', express.static('public'))

// Set EJS as the view engine
app.set('view engine', 'ejs');

// MySQL connection
const db = mysql.createConnection({
  host: 'sql.freedb.tech',
  user: 'freedb_blog-users',
  password: 'R?ua5Rzbp8E9e$2',
  database: 'freedb_node-blog'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the MySQL database.');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


app.get('/', (req, res) => {
  res.redirect('/login');
});

// Register & login route
app.get('/register', (req, res) => {
    res.render('register');
});
  
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
  
    // Check username exists
    db.query('SELECT * FROM users WHERE email = ?', email, (err, rows) => {
      if (err) throw err;
  
      if (rows.length > 0) {
        res.send('<script>alert("Email already exists."); window.location.href="/register";</script>');
      } else {
        // hash the password using bcrypt
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) throw err;
  
          const newUser = {
            name,
            email,
            password: hash
          };
  
          // insert the new user into the database
          db.query('INSERT INTO users SET ?', newUser, (err, result) => {
            if (err) throw err;
            console.log('User registered:', result);

            res.send('<script>alert("Registration Success"); window.location.href="/login";</script>');
          });
        });
      }
    });
});
  
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', email, (err, rows) => {
    if (err) throw err;

    if (rows.length > 0) {
      const storedPassword = rows[0].password;

      bcrypt.compare(password, storedPassword, (err, result) => {
        if (err) throw err;

        if (result) {
          // Passwords match, store the username in the session
          req.session.email = email;
          // res.send('<script>alert("success login"); window.location.href="/dashboard";</script>');
          res.redirect('/dashboard');
        } else {
          // res.status(401).json({ error: 'Incorrect password.' });
          res.send('<script>alert("Incorrect password"); window.location.href="/login";</script>');
        }
      });
    } else {
      // res.status(404).json({ error: 'User not found.' });
      res.send('<script>alert("Incorrect password"); window.location.href="/login";</script>');
    }
  });
});
   
app.get('/dashboard', (req, res) => {
  const email = req.session.email;

  if (!email) {
    return res.redirect('/login');
  }

  db.query(
    'SELECT name FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) throw err;

      if (results.length === 0) {
        return res.redirect('/login');
      }

      const name = results[0].name;

      db.query(
        'SELECT COUNT(*) AS blogCount FROM blogs WHERE email = ?',
        [email],
        (err, results) => {
          if (err) throw err;

          const blogCount = results[0].blogCount;

          db.query(
            'SELECT COUNT(*) AS commentCount FROM comments WHERE email = ?',
            [email],
            (err, results) => {
              if (err) throw err;

              const commentCount = results[0].commentCount;

              db.query(
                'SELECT b.*, c.id AS comment_id, c.email AS comment_email, c.comment, DATE_FORMAT(c.created_at, "%d/%m/%Y") AS comment_created_at FROM blogs AS b LEFT JOIN comments AS c ON b.id = c.blog_id WHERE b.email = ?',
                [email],
                (err, results) => {
                  if (err) throw err;

                  const blogs = [];

                  results.forEach(row => {
                    const blog = blogs.find(b => b.id === row.id);

                    if (!blog) {
                      blogs.push({
                        id: row.id,
                        title: row.title,
                        description: row.description,
                        image: row.image,
                        date: row.date,
                        created_at: row.created_at,
                        comments: row.comment_id ? [{
                          id: row.comment_id,
                          email: row.comment_email,
                          comment: row.comment,
                          created_at: row.comment_created_at
                        }] : []
                      });
                    } else {
                      blog.comments.push({
                        id: row.comment_id,
                        email: row.comment_email,
                        comment: row.comment,
                        created_at: row.comment_created_at
                      });
                    }
                  });

                  res.render('dashboard', { name, email, blogCount, commentCount, blogs });
                }
              );
            }
          );
        }
      );
    }
  );
});
   
// Set up multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/assets/img'); // folder for upload
    },
    filename: (req, file, cb) => {
      const uploadDir = 'public/assets/img';
      const originalName = file.originalname;
      const ext = path.extname(originalName);
      const baseName = path.basename(originalName, ext);
        console.log(originalName, ext, baseName, 'my input')

      let fileNumber = 1;
      let fileName = originalName;
      while (fs.existsSync(path.join(uploadDir, fileName))) {
        fileName = `${baseName}-${fileNumber}${ext}`;
        fileNumber++;
      }
  
      cb(null, fileName);
    }
});
const upload = multer({ storage: storage });


// blog route
app.post('/dashboard/add-blog', upload.single('image'), (req, res) => {
  const { title, description } = req.body;
  const email = req.session.email;

  if (!email) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }
  

  const currentDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // img path
  const imagePath = req.file ? req.file.path : '';

  // Validate that title, description
  if (!title || !description) {
    return res.status(400).json({ error: 'Please provide title, description' });
  }

  const newBlog = {
    title,
    description,
    image: imagePath,
    date: currentDate,
    email
  };

  db.query('INSERT INTO blogs SET ?', newBlog, (err, result) => {
    if (err) throw err;
    
    res.redirect('/dashboard');
  });
});

app.post('/dashboard/delete-blog/:id', (req, res) => {
  const email = req.session.email;
  const blogId = req.params.id;

  if (!email) {
    return res.redirect('/login');
  }

  db.query('DELETE FROM blogs WHERE id = ? AND email = ?', [blogId, email], (err, result) => {
    if (err) throw err;
    console.log('Blog deleted:', result);

    res.redirect('/dashboard');
  });
});

app.get('/dashboard/edit-blog/:id', (req, res) => {
  const email = req.session.email;
  const blogId = req.params.id;

  if (!email) {
    return res.redirect('/login');
  }

  // Fetch the blog for editing
  db.query('SELECT * FROM blogs WHERE id = ? AND email = ?', [blogId, email], (err, results) => {
    if (err) throw err;

    const blog = results[0];

    res.render('update-blog', { blog });
  });
});

app.post('/dashboard/update-blog/:id', upload.single('editImage'), (req, res) => {
  const blogId = req.params.id;
  const { editTitle, editDescription, editDate } = req.body;
  let editImage;

  if (req.file) {
    editImage = req.file.path;
  } else {
    
    db.query('SELECT image FROM blogs WHERE id = ?', [blogId], (err, results) => {
      if (err) throw err;

      // Use the existing image path if no new image was provided
      editImage = results[0].image;

      // Update the blog in the database
      updateBlog(blogId, editTitle, editDescription, editDate, editImage, res);
    });

    return;
  }

  // Update the blog in the database
  updateBlog(blogId, editTitle, editDescription, editDate, editImage, res);
});
  

// Function to update the blog in the database
function updateBlog(blogId, title, description, date, image, res) {
  db.query(
    'UPDATE blogs SET title = ?, description = ?, date = ?, image = ? WHERE id = ?',
    [title, description, date, image, blogId],
    (err, result) => {
      if (err) throw err;
      res.redirect('/dashboard');
    }
  );
}
  

// comment route
app.post('/dashboard/comment/:id', (req, res) => {
  const blogId = req.params.id;
  const { comment } = req.body;
  const email = req.session.email;

  // Insert the comment into the database
  db.query(
    'INSERT INTO comments (blog_id, email, comment, created_at) VALUES (?, ?, ?, NOW())',
    [blogId, email, comment],
    (err, result) => {
      if (err) throw err;

      res.redirect('/dashboard');
    }
  );
});

app.get('/dashboard/edit-comment/:id', (req, res) => {
  const commentId = req.params.id;

  db.query('SELECT * FROM comments WHERE id = ?', [commentId], (err, result) => {
    if (err) throw err;

    if (result.length === 0) {
      return res.redirect('/dashboard');
    }

    res.render('dashboard-edit-comment', { comment: result[0] });
  });
});

app.get('/dashboard/update-blog/:id', (req, res) => {
  const blogId = req.params.id;
  
  
  db.query('SELECT * FROM blogs WHERE id = ?', [blogId], (err, results) => {
    if (err) throw err;
    
    if (results.length === 0) {
      res.send('no blog');
      console.log('no blog')
    } else {
      const blog = results[0]; 
      
      // Render the update blog page with the blog object
      res.render('update-blog', { blog });
    }
  });
});

app.post('/dashboard/update-comment/:id', (req, res) => {
  const commentId = req.params.id;
  const { updatedComment } = req.body;

  db.query('UPDATE comments SET comment = ? WHERE id = ?', [updatedComment, commentId], (err, result) => {
    if (err) throw err;

    res.redirect('/dashboard');
  });
});

app.post('/dashboard/delete-comment/:id', (req, res) => {
  const commentId = req.params.id;

  db.query('DELETE FROM comments WHERE id = ?', [commentId], (err, result) => {
    if (err) throw err;

    res.redirect('/dashboard');
  });
});


// logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) throw err;
    res.redirect('/login');
  });
});
  