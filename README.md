# action

action is a [soca](http://github.com/quirkey/soca) application that does 
simple management of tasks. It can also serve as a demo app for using Sammy/soca/couchapp/CouchDB.

![Screenshot](http://img.skitch.com/20101003-b4st785gc9bp1xj1man91f37iy.png)

# Installation/Getting it Running

Super easy. First, get yourself a Couch: 

[http://www.couchone.com/get](http://www.couchone.com/get)

Next, clone or fork action:

    git clone git://github.com/quirkey/action.git
    
Then edit your DB URL in your .couchapprc
    
    cd action
    open .couchapprc
    
You should make the `"default"` URL map to your couch including your username and password. By default, CouchDB is in admin party mode (meaning you dont need a user/pass and every one is an admin) so you can just get rid of the 'admin:admin' in the default URL or add an admin/admin user to your CouchDB instance.

Then, its easy-peasy:

    soca push
    soca open 
    
And it should open in your browser. If it doesn't, try running 

    soca push --debug 
    
And hopefully it will spit out some errors.





    