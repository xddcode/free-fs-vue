import type { TaskStatus, TransferTask } from '@/types/modules/transfer';

/**
 * 状态转换规则映射表
 * 定义每个状态可以转换到的目标状态列表
 */
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  idle: ['initialized'],
  initialized: ['checking', 'failed', 'cancelled'],
  checking: ['uploading', 'completed', 'failed', 'cancelled'], // completed for quick upload
  uploading: ['paused', 'merging', 'failed', 'cancelled'],
  paused: ['uploading', 'cancelled'],
  merging: ['completed', 'failed'],
  completed: [], // terminal state
  failed: ['initialized'], // retry
  cancelled: [], // terminal state
};

/**
 * 检查状态转换是否有效
 * @param from 当前状态
 * @param to 目标状态
 * @returns 如果转换有效返回 true，否则返回 false
 */
export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  // 允许幂等转换（同一状态到同一状态）
  if (from === to) {
    return true;
  }
  
  const validTargets = VALID_TRANSITIONS[from];
  return validTargets.includes(to);
}

/**
 * 执行状态转换
 * @param task 当前任务
 * @param to 目标状态
 * @returns 如果转换成功返回更新后的任务副本，如果已经是目标状态返回原任务，否则返回 null
 */
export function transition(
  task: TransferTask,
  to: TaskStatus
): TransferTask | null {
  if (!canTransition(task.status, to)) {
    return null;
  }

  // 如果已经是目标状态，直接返回原任务（幂等操作）
  if (task.status === to) {
    return task;
  }

  // 返回更新后的任务副本，保持不可变性
  return {
    ...task,
    status: to,
    updatedAt: Date.now(),
  };
}

/**
 * 状态机接口（用于类型约束）
 */
export interface StateMachine {
  canTransition(from: TaskStatus, to: TaskStatus): boolean;
  transition(task: TransferTask, to: TaskStatus): TransferTask | null;
}

/**
 * 状态机单例对象
 */
export const stateMachine: StateMachine = {
  canTransition,
  transition,
};

export default stateMachine;
