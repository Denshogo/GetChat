export class TaskFeatureService {
  constructor({ taskRepository }) {
    this.taskRepository = taskRepository;
  }

  list() {
    return this.taskRepository.list();
  }

  addTask(title) {
    return this.taskRepository.add(title);
  }

  setCompleted(taskId, isCompleted) {
    this.taskRepository.setCompleted(taskId, isCompleted);
    return this.list();
  }

  markReviewed(taskId) {
    this.taskRepository.markReviewed(taskId);
    return this.list();
  }

  findById(taskId) {
    return this.taskRepository.findById(taskId);
  }
}
