const Task = require('../model/taskModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const Member = require('../model/memberModel'); 
const User = require('../model/userModel');
const moment = require('moment');

// exports.getTasks = catchAsync(async (req, res, next) => {
//   const query = req.query;
//   let dbQuery = Task.find({ createdBy: req.user._id });

//   const today = moment.utc().endOf('day');

//   let range = 7;

//   if (query.range) {
//     range = query.range;
//   }

//   dbQuery = dbQuery.find({
//     createdAt: {
//       $lte: today.toDate(),
//       $gt: today.clone().subtract(range, 'days').toDate(),
//     },
//   });

//   const tasks = await dbQuery;

//   res.status(200).json({
//     status: 'success',
//     results: tasks.length,
//     data: { tasks },
//   });
// });

exports.getTasks = catchAsync(async (req, res, next) => {
  const query = req.query;

  // Find members associated with the user
  const members = await Member.find({ user: req.user._id });
  const memberIds = members.map(member => member._id); // Extract member IDs

  // Create the query to find tasks
  let dbQuery = Task.find({
    $or: [
      { createdBy: req.user._id },  // Tasks created by the user
      { assignedTo: { $in: memberIds } } // Tasks assigned to any of the user's members
    ]
  });

  const today = moment.utc().endOf('day');
  let range = 7;

  if (query.range) {
    range = query.range;
  }

  // Adding date range filter for createdAt
  dbQuery = dbQuery.find({
    createdAt: {
      $lte: today.toDate(),
      $gt: today.clone().subtract(range, 'days').toDate(),
    },
  });

  const tasks = await dbQuery;

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: { tasks },
  });
});

exports.getTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { task },
  });
});

exports.getTasksByMemberUserId = catchAsync(async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the member associated with the specified user ID
    const member = await Member.findOne({ user: userId }).populate('assignedTasks');
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Respond with the tasks assigned to the member
    res.status(200).json({
      status: 'success',
      data: {
        tasks: member.assignedTasks,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});
// exports.addTaskToMember = async (req, res) => {
//   try {
//     const { email, taskTitle, priority, checklists, dueDate } = req.body;

//     // Find the user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Find or create the Member document
//     let member = await Member.findOne({ user: user._id });
//     if (!member) {
//       member = await Member.create({ user: user._id, createdBy: req.user._id });
//     }

//     // Create a new task and assign it to the member
//     const task = await Task.create({
//       title: taskTitle,
//       priority,
//       checklists,
//       dueDate,
//       assignedTo: member._id,
//       createdBy: req.user._id,
//     });

//     // Add the task to the member's assignedTasks
//     member.assignedTasks.push(task._id);
//     await member.save();

//     res.status(201).json({ message: 'Task added to member successfully', task });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'An error occurred while adding task to member' });
//   }
// };


// exports.addTaskToExistingMember = async (req, res) => {
//   try {
//     const { email, taskTitle, priority, checklists, dueDate } = req.body;

//     // Find the user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Find the existing Member document
//     const member = await Member.findOne({ user: user._id });
//     if (!member) {
//       return res.status(400).json({ message: 'Member does not exist for this user' });
//     }

//     // Create a new task and assign it to the member
//     const task = await Task.create({
//       title: taskTitle,
//       priority,
//       checklists,
//       dueDate,
//       assignedTo: member._id,
//       createdBy: req.user._id,
//     });

//     // Add the task to the member's assignedTasks
//     member.assignedTasks.push(task._id);
//     await member.save();

//     res.status(201).json({ message: 'Task assigned to existing member successfully', task });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'An error occurred while assigning the task' });
//   }
// };

exports.createTask = catchAsync(async (req, res, next) => {
  const { title, priority, checklists, dueDate, createdAt, status,email } = req.body;

  const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the existing Member document
    const member = await Member.findOne({ user: user._id });
    if (!member) {
      return res.status(400).json({ message: 'Member does not exist for this user' });
    }

  const task = await Task.create({
    title,
    status,
    priority,
    checklists,
    dueDate,
    createdAt,
    assignedTo: member._id,
    createdBy: req.user._id,
  });

  res.status(200).json({
    message: 'success',
    data: { task },
  });
});

// exports.updateTask = catchAsync(async (req, res, next) => {
//   const { taskId } = req.params;
//   const { title, priority, checklists, dueDate, status,assignedTo,email } = req.body;
//   if(email){
//   const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
  

//     // Find the existing Member document
//     const member = await Member.findOne({ user: user._id });
//     if (!member) {
//       return res.status(400).json({ message: 'Member does not exist for this user' });
//     }
//   }

//   const updatedTask = await Task.findOneAndUpdate(
//     { _id: taskId},
//     {
//       title,
//       priority,
//       checklists,
//       dueDate,
//       status,
//       assignedTo: member._id
//     },
//     { new: true, runValidators: true }
//   );

//   if (!updatedTask) {
//     throw new Error('Task not found', 404);
//   }

//   res.status(200).json({
//     status: 'success',
//     data: { task: updatedTask },
//   });
// });

exports.updateTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { title, priority, checklists, dueDate, status, assignedTo, email } = req.body;

  let assignedMemberId = assignedTo;  

  if (email) {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

     
    const member = await Member.findOne({ user: user._id });
    if (!member) {
      return res.status(400).json({ message: 'Member does not exist for this user' });
    }

    assignedMemberId = member._id;  
  }

  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId },
    {
      title,
      priority,
      checklists,
      dueDate,
      status,
      ...(assignedMemberId && { assignedTo: assignedMemberId })  
    },
    { new: true, runValidators: true }
  );

  if (!updatedTask) {
    return next(new Error('Task not found', 404));  
  }

  res.status(200).json({ 
    status: 'success',
    data: { task: updatedTask },
  });
});


exports.deleteTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;

  if (!taskId) {
    throw new AppError('Please provide a taskId', 400);
  }

  const task = await Task.findOneAndDelete({
    _id: taskId,
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  res.status(204).json({
    status: 'success',
  });
});

exports.analytics = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({ createdBy: req.user._id });

  const status = {
    backlog: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
  };

  const priorities = {
    low: 0,
    high: 0,
    moderate: 0,
    due: 0,
  };

  tasks.forEach((el) => {
    status[el.status]++;
    priorities[el.priority]++;
    if (el.isExpired) {
      priorities.due++;
    }
  });

  res.status(200).json({
    status: 'success',
    data: { status, priorities },
  });
});
