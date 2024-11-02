const { promisify } = require('util');
const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

exports.register = catchAsync(async (req, res, next) => {
  const { email, name, password, confirmPassword } = req.body;

  const user = await User.create({ email, name, password, confirmPassword });

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

// exports.login = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     throw new AppError('Email and Password are required!', 400);
//   }

//   const user = await User.findOne({ email }).select('+password');

//   if (!user || !(await user.comparePasswords(password, user.password))) {
//     throw new AppError('Email or password mismatch', 400);
//   }

//   const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
//     expiresIn: process.env.JWT_EXPIRES_IN,
//   });
//   return res.status(200)
//     .cookie("token", token, { 
//         maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
//         httpOnly: true, 
//         sameSite: 'strict' 
//     })
//     .json({
//       message: 'success',
//       data: {
//         info: { email: user.email, name: user.name, _id: user._id },
//         token,
//       },
//     });
//   });
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and Password are required!', 400);
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePasswords(password, user.password))) {
    throw new AppError('Email or password mismatch', 400);
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  console.log("hjdshbbvjvd",token)

  return res.status(200)
    .cookie("token", token, { 
        httpOnly: true, 
        sameSite: 'none',
        secure: true,
        maxAge: 1 * 24 * 60 * 60 * 1000,
    })
    .json({
      message: 'Login successful',
      data: {
        info: { email: user.email, name: user.name, _id: user._id },
      },
      token,
    });
});
exports.logout = (req, res) => {
  return res
    .status(200)
    .clearCookie("token", { httpOnly: true, sameSite: 'none', secure: true, })
    .json({ message: 'Logout successful' });
};


  

// exports.protect = catchAsync(async (req, res, next) => {
//   const { authorization } = req.headers;

//   if (!authorization) {
//     throw new AppError('Please login to access this route', 401);
//   }

//   const token = authorization.split(' ')[1];

//   const decoded = await promisify(jwt.verify)(
//     token,
//     process.env.JWT_SECRET_KEY
//   );

//   const user = await User.findOne({ _id: decoded.id });
//   if (!user) {
//     throw new AppError('User does not exist!', 401);
//   }

//   req.user = user;

//   next();
// });
exports.protect = catchAsync(async (req, res, next) => {
  const token = req.cookies.token;
  console.error("tokennnnnn", token)



  // Ensure the Authorization header exists and follows the "Bearer <token>" format
  if (!token) {
    throw new AppError('Please login to access this route', 401);
  }



  // Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

  // Check if the user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('User does not exist!', 401);
  }

  // Attach user to the request object
  req.user = user;

  next();
});

