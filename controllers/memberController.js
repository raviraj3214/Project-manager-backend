const Member = require('../model/memberModel.js'); // Adjust the path as needed
const User = require('../model/userModel.js'); // Adjust the path as needed
import catchAsync from '../utils/catchAsync.js';

exports.addMemberByEmail = catchAsync(
async (req, res) => {
    try {
      const { email } = req.body;
    
  
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User with this email not found' });
      }
  
      const createdBy = req.user.id;
  
      // Check if the user is already a member for this creator
      const existingMember = await Member.findOne({ user: user._id, createdBy });
      if (existingMember) {
        return res.status(400).json({ message: 'User is already added as a member by you' });
      }
  
      const newMember = await Member.create({
        user: user._id,
        createdBy,
      });
  
      res.status(201).json({
        status: 'success',
        data: newMember,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  };)


//   exports.getSuggestionsByEmail = async (req, res) => {
//     try {
//       const { email } = req.query; // Get the email query parameter
  
//       if (!email) {
//         return res.status(400).json({
//           status: 'error',
//           message: 'Email query parameter is required',
//         });
//       }
  
//       // Find members whose email contains the search term
//       const suggestions = await Member.find({ email: { $regex: email, $options: 'i' } }).limit(10); // Limit the results to 10
  
//       return res.status(200).json({
//         status: 'success',
//         data: suggestions,
//       });
//     } catch (error) {
//       return res.status(500).json({
//         status: 'error',
//         message: 'Error fetching suggestions',
//         err: error.message,
//       });
//     }
//   };


// exports.getSuggestionsByEmail = async (req, res) => {
//   try {
//     const {email}  = req.query; // Get the email query parameter
//     const userId = req.user.id; // Get the user ID from the authenticated user
//     console.log("dh bd cbhjf ",email)

//     if (!email) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Email query parameter is required',
//       });
//     }

//     // Find members whose email contains the search term and are created by the authenticated user
//     const suggestions = await Member.find({
//       email: { $regex: email, $options: 'i' }, // Case-insensitive regex for email
//       createdBy: userId, // Check that the member was created by the user
//     }).limit(10); // Limit the results to 10

//     return res.status(200).json({
//       status: 'success',
//       data: suggestions,
//     });

//     return res.json({email})
//   } catch (error) {
//     return res.status(500).json({
//       status: 'error',
//       message: 'Error fetching suggestions',
//       err: error.message,
//     });
//   }
// };



exports.getSuggestionsByEmail = catchAsync(async (req, res) => {
  try {
    const { email } = req.query; // Partial email to search
    const userId = req.user.id; // ID of the authenticated user

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email query parameter is required',
      });
    }

    // Find members created by the user, with a case-insensitive partial email match
    const suggestions = await Member.find({
      createdBy: userId,
    })
      .populate({
        path: 'user',
        match: { email: { $regex: email, $options: 'i' } }, // Case-insensitive search
        select: 'name email', 
      })
      .limit(10); 

    // Filter out any members where `user` did not match the email search criteria
    const filteredSuggestions = suggestions.filter(suggestion => suggestion.user);
    return res.status(200).json({
      status: 'success',
      data: filteredSuggestions,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error fetching suggestions',
      err: error.message,
    });
  }
};)
