const bcrypt = require('bcrypt');
const User = require('../model/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const filterObject = (obj, arr) => {
  const updatedObj = {};

  Object.keys(obj).forEach((key) => {
    if (obj[key]) {
      updatedObj[key] = obj[key];
    }
  });

  return updatedObj;
};

exports.getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { info: { name: user.name, email: user.email, _id: user._id } },
  });
});


// Controller to get a user by email
exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    // Validate email input
    if (!email) {
      return res.status(400).json({ message: 'Email is required for search' });
    }

    // Search for user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};


// exports.updateUser = catchAsync(async (req, res) => {
//   const { name, newPassword, oldPassword, email } = req.body;
//   let hashPassword;

//   if (newPassword) {
//     if (!oldPassword) {
//       throw new AppError(
//         'You must provide your old password to update your password.',
//         400
//       );
//     } else {
//       const user = await User.findById(req.user._id).select('+password');

//       if (!(await user.comparePasswords(oldPassword, user.password))) {
//         throw new AppError('Old password is incorrect');
//       }

//       hashPassword = await bcrypt.hash(newPassword, 12);
//     }
//   }

//   const updatedObj = filterObject({ name: name, password: hashPassword,email: email }, [
//     'password',
//     'name',
//     'email'
//   ]);

//   const updatedUser = await User.findByIdAndUpdate(req.user._id, updatedObj, {
//     new: true,
//     runValidators: true,
//   });

//   res.status(200).json({
//     status: 'success',
//     data: { user: updatedUser },
//   });
// });


exports.updateUser = catchAsync(async (req, res) => {
  const { name, newPassword, oldPassword, email } = req.body;
  const userId = req.user._id;

  console.log("Request Name", req.body.name);
  console.log("User ID:", userId);

  // Fetch the current user data
  const currentUser = await User.findById(userId).select('+password');

  // Check if the user was found
  if (!currentUser) {
    console.log("User not found.");
    return res.status(404).json({
      status: 'fail',
      message: 'User not found.',
    });
  }

  console.log("Current User:", currentUser);

  // Check if the new values differ from the current ones
  let isNameChanged = false;
  if (name && name !== currentUser.name) {
    isNameChanged = true;
  }

  let isEmailChanged = false;
  if (email && email !== currentUser.email) {
    isEmailChanged = true;
  }

  console.log("Is Name Changed:", isNameChanged);
  console.log("Is Email Changed:", isEmailChanged);

  let isPasswordChanged = false;
  let hashPassword;

  // Prepare an object to store updates if there are changes
  const updates = {};

  // Add the changed fields to the updates object
  if (isNameChanged) {
    updates.name = name;
    console.log("Name update detected:", name);
  }

  if (isEmailChanged) {
    updates.email = email;
    console.log("Email update detected:", email);
  }

  // Handle password update if new password is provided
  if (newPassword) {
    if (!oldPassword) {
      console.log("Old password not provided.");
      return res.status(400).json({
        status: 'fail',
        message: 'You must provide your old password to update your password.',
      });
    }

    // Compare oldPassword with stored password
    const isOldPasswordCorrect = await currentUser.comparePasswords(oldPassword, currentUser.password);
    console.log("Old Password Correct:", isOldPasswordCorrect);

    if (!isOldPasswordCorrect) {
      console.log("Old password is incorrect.");
      return res.status(400).json({
        status: 'fail',
        message: 'Old password is incorrect.',
      });
    }

    // Hash the new password and mark password as changed
    isPasswordChanged = true;
    hashPassword = await bcrypt.hash(newPassword, 12);
    updates.password = hashPassword;
    console.log("New Password Hash:", hashPassword);
  }

  // If no fields were updated, respond with an error
  if (Object.keys(updates).length === 0) {
    console.log("No changes detected in the provided data.");
    return res.status(400).json({
      status: 'fail',
      message: 'No changes detected in the provided data.',
    });
  }

  console.log("Updates Object:", updates);

  // Update user document with the accumulated updates
  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true, // Return the modified document rather than the original
    runValidators: true, // Ensure validators are applied to the updated fields
  });

  // If the user was not found or updated
  if (!updatedUser) {
    console.log("User update failed.");
    return res.status(500).json({
      status: 'fail',
      message: 'User update failed.',
    });
  }

  console.log("Updated User:", updatedUser);

  // Determine response message
  const shouldLogout = Boolean(isEmailChanged || isPasswordChanged);
  const message = shouldLogout
    ? 'Profile updated. Please log in again.'
    : 'Profile updated successfully.';

  console.log("Should Logout:", shouldLogout);

  // Log the user out if email or password was changed
  if (shouldLogout) {
    return res
      .status(200)
      .json({ status: 'success', message });
  } else {
    return res.status(200).json({
      status: 'success',
      message,
      data: { user: updatedUser },
    });
  }
});
