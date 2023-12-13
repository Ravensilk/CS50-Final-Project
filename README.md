# NeatTasks - To-do List App - Project for CS50's Web Programmming with Python and Javascript
#### Video Demo: https://youtu.be/kvnOgV1Pf5Q
#### Description:

This capstone project is for the CS50W course in EDx. It is a to-do list app that is customizable and has more features to be explained at the later part of this document. It's an app made with Python, Django, Django REST Framework, Javascript, HTML and CSS and uses PostgreSQL for it's database managed by Django's ORM. It is greatly responsive and can be accessed using a mobile phone, tablet or PC.

I envisioned this capstone project to provide a to-do list app that has much more functionality than just showing the different tasks to be done by a user. It is a collaborative app that which can be used by teams to track activities, due dates and keep updated with their projects on real-time.

This system was made to be user-friendly with user experience one of its priorities. It uses different modules and packages from the python library and Django to handle different processes. I have a back-end API system that helps with rendering boards and all of its parts including the lists and cards.

It uses **Django Rest Framework** for the API backend and fully utilized most of Django's modules and functions to fully create the app's user and database management.

#### Distinctiveness and Complexity:

Even though my project is highly inspired by Trello, a tool made by Atlassian, I have made every function from scratch trying to bring the same user experience from my inspiration and have added other several twists and features.

The complexity of this project is quite higher compared to the other projects in this course as I have made use of other libraries such as the Django REST Framework that have helped me understand APIs in a deeper meaning, how to handle requests, send appropriate responses and the proper usage of HTTP codes. With the use of the API that I have made with DRF, I also used Javascript to handle the front-end with real-time changes on modifications, with the help of API.

Aside from this, making this project also helped me dive deeper into Django and how to use some of its libraries, packages, functions and views. This includes the LoginView and several other views used for handling user management. It has also helped me sharpen my skills in using object-relational mappers. In my previous CS50X project, I have used SQLAlchemy which guided me in diving deeper into the Django ORM.  

Lastly, working on this project also teached me how to install my own virtual environment and postgreSQL server in my machine which I can now use in more complex project that I will surely be creating in the future.

#### Notable Libraries, Frameworks and other Technologies Used
- **Django** - Used as a framework on setting up how the website would be renders following an MVC (Model - View - Controller) pattern software design.
- **Django REST Framework** - Used in setting up an API internal backend which is utilized by Django in pulling, updating and deleting records from its database.
- **PostgreSQL** - Used as the server for the databased used by the app. PostgreSQL was chosen over sqlite as it can handle multiple changes more efficiently.
- **PIL** - Pillow - Python Imaging Library - Used for verifying and handling image submissions which are used for customizing a board.

#### Disclaimer 
Any similarities to my inspiration is purely for educational purposes only. No intention is made to claim ownership or rights to any trademarks, copyrighted material, or intellectual property associated with existing products.

## Installation

1. Set-up a PostgreSQL server and database in your machine.
2. Create a .env file inside the **finalproject** application / directory which contains the following variables:
- - SECRET_KEY - A secret key you can generate that will be used by Django to keep the app secure.
- - DB_NAME - The name of the database that you have made in your PostgreSQL server.
- - DB_USER - The username of the user you made and given credentials to the database you created.
- - DB_PASSWORD - The password of the user you made and given credentials to the database you created.
- - DB_PASSWORD - Name of the host you used for hosting the database / postgreSQL server. Usually just 'localhost'.
- - DB_PORT - The port of that you have allocated for your database / postgreSQL server.
3. Go back to your command line / favorite editor and run the virtual environment by typing `source venv/bin/activate`.
4. Migrate any changes or anything that you've added to the models to the database by typing `python manage.py makemigrations` and then `python manage.py migrate`.
5. Run the django server on your machine by typing `python manage.py runserver`.

## Boards
Contains all the views, models, templates and static files for the boards app.

### /static/boards
#### /images

### /templates/boards

- ##### **board.html** - Contains the template used by the board app when rendering the board. It is only accessible by logged in users and shows different parts of the board such as lists, cards and settings.
- ##### **dashboard.html** - Contains the template used by the board app to render the dashboard of a user which shows the boards that the users have created and joined.
- ##### **error.html** - Contains the template used by the board app when rendering errors.
- ##### **layout.html** - Template that is extended by all the other html files in this directory. It contains the navigation bar and header files.

### admin.py
Contains the different functions adding the different models that I have made to the admin dashboard.

### models.py
Contains the **Boards**, **BoardAdministratorship** and **BoardMembership** models. Both **BoardAdministratorship** and **BoardMembership** models are throughs that adds details to the ManytoMany fields contained in the **Boards** model.

### serializers.py
Contains the different serializes that the views.py and Django REST Framework uses to validate API requests and responses.

### urls.py
Contains the urls that are used for board rendering and other board functions used by the API backend.

### views.py
Contains most of the functions that are used for rendering, editing, deleting and updating the boards with the help of the API backend made with DRF.

## Users
Contains all the views, models, templates and static files for the users app.

### /static/users
#### /images

### /templates/users

- ##### **index.html** - Contains the template used by users app to show the default homepage of the website when not logged in.
- ##### **login.html** - Contains the template used by the users app to render the login page.
- ##### **profile.html** - Contains the template used by the users app to render a page for logged in users that lets them change their password.
- ##### **register.html** - Contains the template used by the users app to render the registration page.
- ##### **resetcomplete.html** - Contains the template used by the users app to render a page that is shown once a reset password operation has been successfully completed.
- ##### **resetconfirm.html** - Contains the template used by the users app to render a page that has a form where users need to input their new desired password.
- ##### **resetdone.html** - Contains the template used by the users app that renders a page which says that an email has been sent to the saved email address which contains the link to reset their password.
- ##### **resetpassword.html** - Contains the template used by the users app which renders a page where a user can input their email address to request a reset of their password.
- ##### **layout.html** - Template that is extended by all the other html files in this directory. It contains the navigation bar and header files.

### admin.py
Contains the different functions adding the different models that I have made to the admin dashboard.

### models.py
Contains the **User** and **RegisterForm** models both used for user registration and user management.

### serializers.py
Contains the different serializes that the views.py and Django REST Framework uses to validate API requests and responses.

### urls.py
Contains the urls that are used for user-related functions such as registration, login and changing or resetting of their password.

### views.py
Contains most of the functions that are used for logging in, creating a new user account, changing user password and more.

## Lists
Contains all the views, models, templates and static files for the Lists app.

### /static/lists

### /templates/lists

### admin.py
Contains the different functions adding the different models that I have made to the admin dashboard.

### models.py
Contains the **Lists** model which is used by the Boards models in order to handle list-related operations.

### serializers.py
Contains the different serializes that the views.py and Django REST Framework uses to validate API requests and responses.

### urls.py
Contains the urls that are used for list-related functions such as creating, updating and deleting lists from a board.

### views.py
Contains most of the functions that are used for creating, updating and deleting lists from a board.

## Cards
Contains all the views, models, templates and static files for the Cards app.

### /static/cards

### /templates/cards

### admin.py
Contains the different functions adding the different models that I have made to the admin dashboard.

### models.py
Contains the **Cards**, **Updates** and **Labels** models which is used by the Boards models in order to handle card-related operations. Both **Updates** and **Labels** models are used by the **Cards** model to handle changes and labels added to the cards.

### serializers.py
Contains the different serializes that the views.py and Django REST Framework uses to validate API requests and responses.

### urls.py
Contains the urls that are used for list-related functions such as creating, updating and deleting cards from a board.

### views.py
Contains most of the functions that are used for creating, updating and deleting cards from a board.
