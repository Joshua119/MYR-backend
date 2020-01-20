const request = require('supertest');
const app = require('./../app');
const assert = require('assert');

function sceneIsEqual(scene1, scene2, name, prefix=undefined){
    let props1 = Object.getOwnPropertyNames(scene1);

    for(let i = 0; i < props1.length; i++){
        let propName = props1[i];
        if(propName === "settings"){
            sceneIsEqual(scene1[propName], scene2[propName], name, "settings");
        }else {
            assert(scene1[propName] === scene2[propName], 
                `${name}'s ` + (prefix ? `[${prefix}]` : "" ) + `[${propName}] are not equal!\n`);
        }
    }
    return true;
}

const test_scenes = [
    {
        "_id": "5de934ec824a0a4598aa1fed",
        "name": "Testing",
        "uid": "testing",
        "code": "hellotheresir",
        "settings": {
            "skyColor": "#00ff42",
            "showFloor": true,
            "floorColor": "#ff7800",
            "showCoordHelper": true,
            "camPositon": "0 0 0",
            "camConfig": 0,
            "canFly": false,
            "viewOnly": false
        }
    },
    {
        "_id": "5de93a961466c65b7fda92dc",
        "name": "Testing2",
        "uid": "testing",
        "code": "box();",
        "settings": {
            "skyColor": "#00ff42",
            "showFloor": false,
            "floorColor": "#ff7800",
            "showCoordHelper": true,
            "camPositon": "0 0 0",
            "camConfig": 0,
            "canFly": false,
            "viewOnly": false
        }
    },
    {
        "_id": "5e25e92650ad1728d545ada0",
        "name": "This is only a test",
        "uid": "gordon",
        "code": "dodecahedron();",
        "settings": {
            "skyColor": "#00ff42",
            "showFloor": false,
            "floorColor": "#ff7800",
            "showCoordHelper": true,
            "camPositon": "0 0 0",
            "camConfig": 0,
            "canFly": true,
            "viewOnly": false
        }
    }
];

describe("Try to fetch lessons", () =>{
    test("Without a user id, it should return with a 401 Unauthorized", () =>{
        return request(app).get('/apiv1/scenes').expect(401);
    });
    test("With an invalid user id, it should return 204 No Content", () => {
        return request(app).get('/apiv1/scenes').set({"x-access-token": "bobross"}).expect(204);
    });
   test("With a valid id, it gets all scenes for that user", () =>{
        return request(app).get('/apiv1/scenes').set({"x-access-token": "testing"})
            .expect(200).then(response =>{
                for(let i = 0; i < test_scenes.length - 1   ; i++){
                    sceneIsEqual(test_scenes[i], response.body[i], test_scenes[i].name);
                }
         });
   });
   test("With a valid id and a URL containing the Scence ID, only the scene with that specific ID should be returned", () =>{
       let test1 = request(app).get(`/apiv1/scenes/id/${test_scenes[0]._id}`).set({"x-access-token": "testing"})
            .expect(200).then(response =>{
                sceneIsEqual(test_scenes[0], response.body, test_scenes[0].name);
        });
        let test2 = request(app).get(`/apiv1/scenes/id/${test_scenes[1]._id}`).set({"x-access-token": "testing"})
            .expect(200).then(response =>{
                sceneIsEqual(test_scenes[1], response.body, test_scenes[1].name);
        });
        
        return test1 && test2;
   });
});

describe("Scene Creation, Deletion, and Updates", () =>{
    const uid = "bobross";
    let lesson = {
        "_id": "",      
        "name": "Happy little trees",
        "code": "box();",
        "settings": {
            "skyColor": "#00ff42",
            "showFloor": false,
            "floorColor": "#ff7800",
            "showCoordHelper": true,
            "camPositon": "0 0 0",
            "camConfig": 0,
            "canFly": false,
            "viewOnly": false
        }
    };
    //Creation section
    test("Without a Body for creation, a 400 Error should be supplied", () =>{
        return request(app).post(`/apiv1/scenes`).set({"x-access-token": uid}).expect(400);
    });
    test("Without a User ID for creation, a 400 Error should be returned",() => {
        return request(app).post(`/apiv1/scenes`).send(lesson).set({"Content-Type": "application/json"})
            .expect(400);
    });
    test("Given a valid body and user id for creation, the scene should be created and a 201 code should be returned with the new ID for the scene", () =>{
        return request(app).post(`/apiv1/scenes`).send(lesson).set({"Content-Type": "application/json", "x-access-token": uid})
            .expect(201).then(response => { 
                lesson._id = response.body._id;
                lesson.uid = uid;
                return request(app).get(`/apiv1/scenes/id/${lesson._id}`).set({"x-access-token": uid}).expect(200).then(response =>{
                    return sceneIsEqual(lesson, response.body, lesson.name);
                });
            });
    });
    //Update section
    test("If a scene update is attempted with no User ID, it should return a 400", () => {
        return request(app).put(`/apiv1/scenes/id/${lesson._id}`).send(lesson).set({"Content-Type": "application/json"})
            .expect(400);
    });
    test("If a scene update is attempted using a UID that is not the owner's, it should return 403", () => {
        return request(app).put(`/apiv1/scenes/id/${lesson._id}`).send(lesson).set({"content-Type": "application/json", "x-access-token": "invalid"})
            .expect(401);
    });
    test("If a scene update is attempted with no body it should return 400", () =>{
        return request(app).put(`/apiv1/scenes/id/${lesson._id}`).set({"x-access-token": uid}).expect(400);
    });
    test("If a scene update is attempted with no settings in the body, it should return 400", () => {
        return request(app).put(`/apiv1/scenes/id/${lesson._id}`).send({
            "name": "Happy little trees",
            "code": "box();\nprism();"
        }).set({"x-access-token": uid, "Content-Type": "application/json"}).expect(400);
    });
    test("If a scene update is attempted with valid body and UID, then it should return 200 and the scene id should be the same", () =>{
        lesson.code = "box();\nprism();";
        return request(app).put(`/apiv1/scenes/id/${lesson._id}`).send(lesson).set({"x-access-token": uid, "Content-Type": "application/json"})
            .expect(200).then(response =>{
                return request(app).get(`/apiv1/scenes/id/${lesson._id}`).set({"x-access-token": uid}).expect(200).then(response =>{
                    sceneIsEqual(lesson, response.body, lesson.name);
                });
            });
    });
    //Delete section
    test("If a scene deletion is attempted without a User ID, it should return 400", () => {
        return request(app).delete(`/apiv1/scenes/id/${lesson._id}`).expect(400);
    });
    test("If a scene deletion is attempted using a User ID that is not the owner's, it should return 401", () =>{
        return request(app).delete(`/apiv1/scenes/id/${lesson._id}`).set({"x-access-token": "invalid"}).expect(401);
    });
    test("If a scene deletion is performed using a valid User ID, it should delete the scene (returning 204), which then should result in further GET requests returning 404", () =>{
        return request(app).delete(`/apiv1/scenes/id/${lesson._id}`).set({"x-access-token": uid}).expect(204).end(() => {
            return request(app).get(`/apiv1/scenes/id/${lesson._id}`).set({"x-access-token": uid}).expect(404);
        });
    });
});