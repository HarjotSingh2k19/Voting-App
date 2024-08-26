const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {jwtAuthMiddleware, generateToken} = require('../jwt');
const Candidate = require('../models/candidate');


const checkAdminRole = async (userID) => {
   try{
        const user = await User.findById(userID);
        if(user.role === 'admin'){
            return true;
        }
   }catch(err){
        return false;
   }
}

// POST route to add a candidate
router.post('/', jwtAuthMiddleware, async (req, res) =>{
    try{
        if(!(await checkAdminRole(req.user.id))){
            return res.status(403).json({message: 'user does not have admin role'});
        }

        const data = req.body // Assuming the request body contains the candidate data

        // Create a new User document using the Mongoose model
        const newCandidate = new Candidate(data);

        // Save the new user to the database
        const response = await newCandidate.save();
        console.log('data saved');
        res.status(200).json({response: response});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.put('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id)){
            return res.status(403).json({message: 'user does not have admin role'});
        }

        const candidateID = req.params.candidateID; // Extract the id from the URL parameter
        const updatedCandidateData = req.body; // Updated data for the person

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true, // Return the updated document
            runValidators: true, // Run Mongoose validation
        })

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate data updated');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.delete('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id)){
            return res.status(403).json({message: 'user does not have admin role'});
        }

        const candidateID = req.params.candidateID; // Extract the id from the URL parameter

        const response = await Candidate.findByIdAndDelete(candidateID);

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate deleted');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

// let's start voting

router.post('/vote/:candidateID', jwtAuthMiddleware, async (req,res) => {
    // no admin can vote
    // user can vote only once

    const candidateID = req.params.candidateID;
    const userID = req.user.id;

    try{

        const candidate = await Candidate.findById(candidateID);
        if(!candidate){
            return res.status(404).json({message: 'Candidate not found'});
        }

        const user = await User.findById(userID);
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }

        if(user.isVoted == true){
            return res.status(400).json({message: 'You have already voted'});
        }

        if(user.role === 'admin'){
            return res.status(403).json({message: 'Admin is not allowed to vote'});
        }

        // update the candidate document to record vote
        candidate.votes.push({user: userID});
        candidate.voteCount++;
        await candidate.save();

        // update the user document
        user.isVoted = true;
        await user.save();

        res.status(200).json({message: 'Vote recorded successfully'});


    } catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }

})


// vote count
router.get('/vote/count', async(req, res) => {
    try{

        // find all the candidates and sort them by descending order
        const candidate = await Candidate.find().sort({voteCount: 'desc'});

        // map the candidates to only return their name and votecount
        const voteRecord = candidate.map((data) => {
            return {
                party: data.party,
                count: data.voteCount
            }
        })

        return res.status(200).json(voteRecord);

    } catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})


// // Get List of all candidates with only name and party fields
router.get('/' , async(req, res) => {
    try{
        // Find all candidates and select only the name and party fields, excluding _id
        const candidates = await Candidate.find({}, 'name party -_id');
        res.status(200).json(candidates);
    } catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})





module.exports = router;