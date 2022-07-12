const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title.length <= 25 && author.length <= 50 && email && file) {
      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExtension = file.path.split('.').slice(-1)[0]

      const textPattern = new RegExp(/(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/, 'g');
      const titleMatched = title.match(textPattern).join('');
      const authorMatched = author.match(textPattern).join('');

      const emailPattern = new RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, 'g');
      const emailMatched = email.match(emailPattern).join('');

      if((fileExtension === 'jpg' || fileExtension === 'png' || fileExtension === 'gif') && title === titleMatched && author === authorMatched && email === emailMatched) {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
          throw new Error('Wrong input!');
      }
    } else {
        throw new Error('Wrong input!');
    }
  } catch(err) {
      res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const userIp = requestIp.getClientIp(req);
    const userVoter = await Voter.findOne({ user: userIp})
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });

    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
        if (!userVoter){
        const newVoter = new Voter ({
          user: userIp,
          votes: [photoToUpdate._id],
        })
        await newVoter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      } else {
        const findVote = userVoter.votes.includes(photoToUpdate._id) 
        if (findVote) {
          res.status(500).json({ message: 'You can not vote twice on the same picture'})
        }
        else if (!findVote) {
          userVoter.votes.push(photoToUpdate._id)
          await userVoter.save();
          photoToUpdate.votes++;
          photoToUpdate.save();
          res.send({ message: 'OK' });
        }
      }
    }
  } catch(err) {
    res.status(500).json(err);
  }
};

