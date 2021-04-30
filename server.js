const express = require('express');

const app = express();

const knex = require('knex');

const cors = require('cors');

const bcrypt = require('bcrypt-nodejs');

const fs = require('fs');

const bodyParser = require('body-parser');
const { start } = require('repl');

app.use(( err, req, res, next ) => {
    res.locals.error = err;
    if (err.status >= 100 && err.status < 600)
      res.status(err.status);
    else
      res.status(500);
    res.render('error');
  });

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use(bodyParser.json());
app.use(cors());

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'tonigashi1',
      database : 'Mallimize'
    }
});

app.get('/', (req, res) => {

})

app.post('/signin', (req,res) => { //works
    db.select('email', 'hash').from('login').where({'email': req.body.email})
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if(isValid)
        {
            return db.select('*').from('users').where({'email': req.body.email})
            .then(user => {
                console.log(user);
                res.json(user[0]);
            })
            .catch(err => res.status(400).json('Unable to get user.'))
        }
        else
            res.status(400).json('Wrong credentials');
    })
    .catch(err => res.status(400).json('Wrong Credentials'));
})

app.post('/saveImg', (req,res) => { 
    const {img, id} = req.body;
    if(!img || id=='undefined' || !id)
        res.status(400).json('incorrect submission');

    try {
    const uploadPath = `/Users/Toni/Desktop/SeniorProject/mallify/public/Images/`;

    const ext = img.substring(img.indexOf("/")+1, img.indexOf(";base64"));
    const fileType = img.substring("data:".length,img.indexOf("/"));

    const regex = new RegExp(`^data:${fileType}\/${ext};base64,`, 'gi');
    const base64Data = img.replace(regex, "");

    const filename = `${id}.${ext}`;
    if(!fs.existsSync(uploadPath+filename))
        fs.writeFileSync(uploadPath+filename, base64Data, 'base64');
    else{
        fs.unlinkSync(uploadPath+filename);
        fs.writeFileSync(uploadPath+filename, base64Data, 'base64');
    }
    db.from('users').where({'id':id}).update({photo:`http://127.0.0.1:8887/${filename}`})
    .then(resp => {console.log(resp,'HELLO');});
    res.json(`http://127.0.0.1:8887/${filename}`);
    } catch (error) { 
        console.log("Problem with file upload");
    }
})

app.get('/list', (req, res) => {
    db.select('name').from('stores').then(stores =>{
        console.log(stores);
        res.json(stores);
    })
    .catch(err => res.status(400).json('error getting stores.'));
})

app.post('/register', (req,res) => { //works
    const {email, name, password} = req.body;
    if(!email || !name || !password)
        return res.status(400).json('incorrect form submission');
    const hash = bcrypt.hashSync(password);
    
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
                email: loginEmail[0],
                name: name,
                photo:"http://localhost:8887/noImg.jpg"
            })
            .then(user => {
                res.json(user[0]);
            })
            .then(trx.commit)
            .catch(trx.rollback);
        })
        .catch(err => res.status(400).json('unable to register'));
    })
})



//ASTAR begins
class Cell {
    constructor(i,j) {
        this.i = i;
        this.j = j;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.neighbors = [];
        this.previous;

        this.addNeighbors = function(grid) {
            let i = this.i;
            let j = this.j;

            if(i<grid.length-1)
            {
                this.neighbors.push(grid[i+1][j]);
            }
            if(i>0)
            {
                this.neighbors.push(grid[i-1][j]);
            }
            if(j<grid[0].length-1)
            {
                this.neighbors.push(grid[i][j+1]);
            }
            if(j>0)
            {
                this.neighbors.push(grid[i][j-1]);
            }
        }
    }

}
function removeElementFromArray(arr, el) {
    for(let i=arr.length-1; i>=0;i--) {
        if(arr[i]==el) {
            arr.splice(i,1);
        }
    }
}
function heuristic(a,b) { //Euclidian distance
    return (Math.sqrt(Math.pow((a.i-b.i),2)+ Math.pow((a.j-b.j),2)))
}
function AStar(grid, startP, endP, response) {

    let travelForward=0;
    let travelLeft=0;
    let startX = startP.x;
    let startY = startP.y;
    let endX = endP.x;
    let path = [];
    let endY = endP.y;

    const start = grid[startX][startY];
    const end = grid[endX][endY]; 

    let openSet = [];
    let closedSet = [];

    openSet.push(start);

    while(openSet.length>0)
    {
        let lowestIndex = 0
        for(let i =0; i<openSet.length; i++)
        {
            if(openSet[i].f<openSet[lowestIndex].f)
            {
                lowestIndex=i;
            }
        }
 
        let current = openSet[lowestIndex];
 
        if(current === end)
        {
           path = [];
           var temp = current;
           //path.push(temp);
            while(temp.previous) {
                //console.log(temp.previous);
                path.push(temp.previous);
                if(temp.i<temp.previous.i)
                    travelForward--;
               else if(temp.i>temp.previous.i)
                    travelForward++;
                if(temp.j<temp.previous.j)
                    travelLeft--;
                else if(temp.j>temp.previous.j)
                    travelLeft++;
                temp=temp.previous;
            }
            //console.log(path);
            if(travelLeft>=0 && travelForward>=0)
                response.a+=("From the "+startP.name+" you will have to walk "+travelForward+" meters forward and "+travelLeft+" meters to your left to reach "+endP.name+".\n"); 
            else if(travelForward<0 && travelLeft>=0)
                response.a+=("From the "+startP.name+" you will have to walk "+(-travelForward)+" meters back and "+travelLeft+" meters to your left to reach "+endP.name+".\n"); 
            else if(travelForward>=0 && travelLeft<0)
                response.a+=("From the "+startP.name+" you will have to walk "+travelForward+" meters forward and "+(-travelLeft)+" meters to your right to reach "+endP.name+".\n"); 
            else
                response.a +=("From the "+startP.name+" you will have to walk "+(-travelForward)+" meters back and "+(-travelLeft)+" meters to your right to reach "+endP.name+".\n"); 
            console.log(response.a);
        }
 
        removeElementFromArray(openSet, current);
        closedSet.push(current);
 
        let neighbors =  current.neighbors;
        for(let i=0; i<neighbors.length; i++) 
        {
            let neighbor = neighbors[i];
 
            if(!closedSet.includes(neighbor))
            {
                let tempG = current.g +1;
 
                if(openSet.includes(neighbor)) 
                {
                    if(tempG<neighbor.g) 
                    {
                        neighbor.g = tempG;
                    }
                }
                else 
                {
                    neighbor.g = tempG;
                    openSet.push(neighbor);
                }
 
                 
                neighbor.h = heuristic(neighbor, end);
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.previous = current;
            }
        }
    }
}
app.post('/direction', (req,res) => { //TODO: if we have time make it work for second floor and add walls
   let {startP, endP} = req.body
   let response={a:""};
   let escalators = [];
   db.select('*').from('stores').then(data => {

    data.forEach(store => {
      if("Escalator"==store.name)
        escalators.push(store);
      if(startP == store.name)    
          startP=store;
        else if(endP == store.name)
            endP=store;
    });

    
    firstFloor = data.filter((store) => {
        return store.floornumber<2
    }) 

    const cols = 37;
    const rows = 11;
    
    let grid1 = new Array(cols);
    let grid2 = new Array(cols);
  
    for(let i=0; i<cols; i++)
    {
        grid1[i] = new Array(rows);
        grid2[i] = new Array(rows);
    } // creating double array grids for both floors
 
    for(let i=0; i<cols; i++) //Filling grid with cells
    {
         for(let j=0; j<rows; j++)
         {
            grid1[i][j] = new Cell(i,j);
            grid2[i][j] = new Cell(i,j);
         }
    }
 
    //TODO: FIX EFFICIENCY
    for(let i=0; i<cols; i++)
    {
         for(let j=0; j<rows; j++)
         {
             grid1[i][j].addNeighbors(grid1);
             grid2[i][j].addNeighbors(grid2);
         }
    } 

    if((firstFloor.includes(startP) && firstFloor.includes(endP))) 
        AStar(grid1, startP, endP, response);
    else if (!firstFloor.includes(startP) && !firstFloor.includes(endP))
        AStar(grid2, startP, endP, response);
    else if (firstFloor.includes(startP) && !firstFloor.includes(endP))
    {
        response.a=("In order to get to your destination from your location you have to go upstairs"+`\n`);
        response.a+=("If you are facing the exit:");
        if(heuristic({i:escalators[0].x, j:escalators[0].y}, {i:startP.x, j:startP.y}) <= heuristic({i:escalators[1].x, j:escalators[1].y},{i:startP.x, j:startP.y})) //if the first escalator is closer use that one
        {
            AStar(grid1, startP, escalators[0], response);
            AStar(grid2, escalators[0], endP, response);
        }
        else {
            AStar(grid1, startP, escalators[1], response);
            AStar(grid2, escalators[1], endP, response);
        }
    }
    else 
    {
        response.a+=("In order to get to your destination from your location you have to go downstairs"+"\n");
        if(heuristic({i:escalators[0].x, j:escalators[0].y}, {i:startP.x, j:startP.y}) <= heuristic({i:escalators[1].x, j:escalators[1].y},{i:startP.x, j:startP.y})) //if the first escalator is closer use that one
        {
            AStar(grid2, startP, escalators[0], response);
            AStar(grid1, escalators[0], endP, response);
        }
        else {
            AStar(grid2, startP, escalators[1], response);
            AStar(grid1, escalators[1], endP, response);
        }
    }
    console.log(response.a);
    res.json(response.a);
   })
})
//ASTAR ends



app.get('/discover', (req,res) => {
    console.log('deals works'); 
})

app.post('/recommender', (req,res) => {
    let {name} = req.body; 
    let users = [];
    let names = [];
    let ratedProductIds = [];
    db.select('*').from('order_items').join('orders','orderid','orders.id').join('users','userid','users.id').join('products','products.id','productid').then(data => {
       
        data.forEach((el) => { //NAME AND ALL THE RATINGS
            if(!ratedProductIds.includes(el.productid))
                ratedProductIds.push(el.productid);
            if(!names.includes(el.name))
            { 
                names.push(el.name);
                users[el.name]=[[el.productid, el.Rating]]
            }
            else
            {
                users[el.name].push([el.productid,el.Rating]); 
            }
        }) 
        console.log(users);
        if(names.includes(name))
        {
            let Arr=[];
            names.forEach(userName => {
                if(name!=userName)
                {
                    let currAlike=0;
                    for(var i=0;i<users[name].length;i++)
                    {
                        for(var j=0;j<users[userName].length;j++) 
                        {
                            if(users[name][i][0]==users[userName][j][0])
                            {
                                let diff = users[name][i][1] - users[userName][j][0];
                                currAlike += Math.sqrt(diff*diff);
                            }
                        }
                    }
                    let similarityScore = 1/(1+currAlike);
                    if(similarityScore!=1)
                    {
                        let user= {};
                        user["score"] = similarityScore;
                        user["name"] = userName;
                        Arr.push(user);
                    }
                }
            });

            Arr.sort(function(b, a){
                return a.score - b.score;
            })
            //since I wanna recommend only 4 items
            let first5Names = [Arr[0].name,Arr[1].name,Arr[2].name,Arr[3].name,Arr[4].name]
            let nrOfItems = 0;
            let items = [];

            while(nrOfItems<=3)
            {
                for(let i = 0; i<first5Names.length; i++)
                {
                    for(let j=0; j<users[Arr[i].name].length; j++)
                    {
                        if(users[Arr[i].name][j][1]>=3)
                        {
                            if(!items.includes(users[Arr[i].name][j][0]))
                            {
                                items.push(users[Arr[i].name][j][0]);
                                nrOfItems++;
                            }

                        }
                        if(nrOfItems>3)
                            break;
                    }
                    if(nrOfItems>3)
                            break;
                }
            }
            db.select('*').from('products').where(function() {
                this.where('id',items[0]).orWhere('id',items[1]).orWhere('id',items[2]).orWhere('id',items[3]);
            }).then(data => {
               res.json(data);  
            })
            
        }
        else
        {
            let items = [1,6,4,10];
            db.select('*').from('products').where(function() {
                this.where('id',items[0]).orWhere('id',items[1]).orWhere('id',items[2]).orWhere('id',items[3]);
            }).then(data => {
               res.json(data);  
            })
            //if it is a new user
        }
    });
    
})  


app.listen(3000, () => {
    console.log('app is running on port 3000');
})