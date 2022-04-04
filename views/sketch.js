let video;
let poseNet;
let pose;
let skeleton;

let brain;
let poseLabel = "";

let nowPose = "";
let oldPose = "";
let rep = 0;
let repti = 0;
let repLimit =0;

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

// console.log("Hello");
// sleep(10000);
// console.log("World!");

function setup() {

  sleep(5000);

  var myCanvas = createCanvas(640, 480);
  myCanvas.parent('booth');
  video = createCapture(VIDEO);
  video.hide();
  
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose', gotPoses);

  

  let options = {
    inputs: 34,
    outputs: 4,
    task: 'classification',
    debug: true
  }
  brain = ml5.neuralNetwork(options);
  const modelInfo = {
    model: 'model/model (1).json',
    metadata: 'model/model_meta (1).json',
    weights: 'model/model.weights (1).bin',
  };
  brain.load(modelInfo, brainLoaded);

  
  
}

function brainLoaded() {
  console.log('pose classification ready!');
  classifyPose();
}

function classifyPose() {
  if (pose) {
    let inputs = [];
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      inputs.push(x);
      inputs.push(y);
    }
    brain.classify(inputs, gotResult);
  } else {
    setTimeout(classifyPose, 100);
  }
}

function gotResult(error, results) {

  // var elem1 = document.getElementById('name2');
  // elem1.innerHTML=round(results[0].confidence * 100)+"%";
  
  if (results[0].confidence > 0.75) {
    poseLabel = results[0].label.toUpperCase();
    
    if (poseLabel === "U"){
      poseLabel = "Up"
    }else{
      poseLabel = "Down"
    }
    //console.log(poseLabel);
    var elem = document.getElementById('name1');
    elem.innerHTML=rep;

    // var elem1 = document.getElementById('name2');
    // elem1.innerHTML=round(results[0].confidence * 100);
    
    nowPose = poseLabel
    let d = 0;
    let accu = 100;
    if(nowPose==="Up"){
      d = dist(pose.leftShoulder.x, pose.leftShoulder.y, pose.leftWrist.x, pose.leftWrist.y);
      if(d>70){
        accu = 100;
      }else{
        accu = round((d*100)/100);
      }
    }else{
      d = dist(pose.leftShoulder.x, pose.leftShoulder.y, pose.leftWrist.x, pose.leftWrist.y);
      if(d>170){
        accu = 100;
      }else{
        accu = round((d*100)/170);
      }
    }

    var elem1 = document.getElementById('name2');
    elem1.innerHTML=round(accu)+"%";

    if(nowPose === oldPose){
      
    }else{
      repLimit++;
      if (repLimit>15){
        repti++;
        repLimit=0;
        
        if(nowPose==="Down"){
          let edit_save = document.getElementById("edit-save");
          edit_save.src = "./11.jpg";
        }else{
          let edit_save = document.getElementById("edit-save");
          edit_save.src = "./22.jpg";
        }
        oldPose = nowPose;
        if(repti>1 && repti%2===1){
          rep++
        }
      }
    }

    
  }
  //console.log(results[0].confidence);
  classifyPose();
}


function gotPoses(poses) {
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
  }
}


function modelLoaded() {
  console.log('poseNet ready');
}

function draw() {
  push();
  translate(video.width, 0);
  scale(-1, 1);
  image(video, 0, 0, video.width, video.height);

  if (pose) {

    fill(0, 0, 255);
    ellipse(pose.rightWrist.x, pose.rightWrist.y, 32);
    ellipse(pose.leftWrist.x, pose.leftWrist.y, 32);
    ellipse(pose.rightShoulder.x, pose.rightShoulder.y, 32);
    ellipse(pose.leftShoulder.x, pose.leftShoulder.y, 32);
    
    for (let i = 0; i < skeleton.length; i++) {
      let a = skeleton[i][0];
      let b = skeleton[i][1];
      strokeWeight(2);
      stroke(0);

      line(a.position.x, a.position.y, b.position.x, b.position.y);
    }
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      fill(0);
      stroke(255);
      ellipse(x, y, 16, 16);
    }
  }
  pop();

  fill(255, 0, 255);
  noStroke();
  textSize(100);
  textAlign(CENTER, CENTER);
  text(poseLabel, width / 2, height / 2);
}