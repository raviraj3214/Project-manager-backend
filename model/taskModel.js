const mongoose = require('mongoose');

const checkListSchecma = new mongoose.Schema({
  checked: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['high', 'moderate', 'low'],
      required: true,
    },
    checklists: {
      type: [checkListSchecma],
      required: true,
      validate: {
        validator: function (val) {
          return val.length > 0;
        },
        message: 'Please add at least one checklist',
      },
    },
    status: {
      type: String,
      enum: ['backlog', 'inProgress', 'todo', 'done'],
      default: 'todo',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Member',
      required: true, 
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Reference to the user who created the task
    },
    dueDate: { type: Date },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

taskSchema.virtual('isExpired').get(function () {
  if (!this.dueDate) {
    return false;
  }

  return new Date() > this.dueDate;
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;