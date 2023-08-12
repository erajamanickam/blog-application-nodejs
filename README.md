
# Blog Application Nodejs

The Blogging Platform is a web application that allows users to create, manage, and publish their own blog posts. It provides a user-friendly interface for writing and organizing blog content, as well as features for user authentication, comment management, and blog customization.



## Installation

Prerequisites

- Node.js (version >= 12.0.0)
- MySQL database

#### Step 1: Clone the Repository

```bash
  git clone https://github.com/erajamanickam/blog-application-nodejs-mysql

```

#### Step 2: Install Dependencies

```bash
  cd blogging-platform
  npm install
```

#### Step 3: Configure the Database
Create a MySQL database for the Blogging Platform

```bash
  DB_HOST=localhost
  DB_USER=your_database_username
  DB_PASSWORD=your_database_password
  DB_NAME=your_database_name
```

#### Step 5: Start the Application
You are now ready to start the Blogging Platform. Run the following command:

```bash
  npm start
```

## Key Features

- User Registration and Login Authentication
- Blog Creation and Management
- Blog List and Sorting
- Blog Comment Management
- Dashboard

#### User Registration and Login Authentication
Users can sign up for an account and log in to the platform using their credentials. Authentication is implemented using JSON Web Tokens (JWT) for secure access to user-specific features

#### Blog Creation and Management
Authenticated users can create new blog posts, edit existing posts, and delete unwanted posts. The platform provides a rich text editor for easy content creation, allowing users to format text, add images, and include other media.

#### Blog List and Sorting
The platform displays a list of blog posts, ordered by the latest date. Users can browse through the blog list to discover and read the most recent posts.

#### Blog Comment Management
Users can leave comments on blog posts to engage in discussions. They can also edit and delete their own comments. The comments are displayed below each blog post, showing the user's name, comment content, and the timestamp of the comment.

#### Dashboard
Authenticated users have access to a dashboard that provides an overview of their blog activity. The dashboard includes statistics on blog views, comments, and engagement.
## Deployment

To deploy this project run

```bash
  npm run deploy
```


## Technologies Used

- Nodejs
- Express
- MySQL


## Authors

- [@Rajamanickam](https://github.com/erajamanickam)


## Feedback

If you have any feedback, please reach out to us at erajamanickam72@gmail.com

