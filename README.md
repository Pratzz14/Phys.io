# Phys.io
### Recommending and Monitoring Physiotherapy exercises
Here we created an application that does pose estimation using the PoseNet model, the output of which is sent to our custom Classifier model to check if the user is in the required pose. From this, we infer the repetitions and accuracy. We are also showing the next move to be performed. We are taking the pain range of the user's joints using which we can recommend them specific set of exercises. 
<br><br>
All the data collection and training were done in JavaScript using the ml5js library. We created a specific tool for data collection (did lose some pounds creating the dataset itself 😛).
<br><br>
We also deployed our project on the cloud, using:<br>

**AWS EC2** - mainly to host our NodeJs server<br>
**AWS S3** - for storing large size profile pictures<br>
**MongoDB Atlas** - hosting our database<br>
<br>
Special thanks to The Coding Train for teaching us this stuff 😁.
<br>
<br>
Video Demo : https://youtu.be/N1kkNUhd44I
<br>
<br>
<center>
	<a href="https://youtu.be/N1kkNUhd44I">
		<img src="./demo/demo.png" alt="demo" width="600" height="350" />
	</a>
</center>
<br>

### Application design:
<br>
<center>
		<img src="./demo/system1.png" alt="system1" width="500" height="450" />

</center>
<br>
<br>
<center>
		<img src="./demo/system2.png" alt="system2" width="400" height="500" />

</center>
<br>

### Team:
Pratik Mahankal
<br>
Nigel Malappan
<br>
Monish Raval
<br>
Nigel Lobo