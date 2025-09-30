/**
 * 任务管理工具
 */

export interface TimerTask {
  destroy(): void;
}

export interface TaskOptions {
  description: string;
  time: number;
  once: boolean;
  fn: () => void;
}

/**
 * 任务管理器类
 */
export class TaskManager {
  static Timer = class Timer implements TimerTask {
    #timerId: NodeJS.Timeout | number | null = null;
    #options: TaskOptions;

    constructor(options: TaskOptions) {
      this.#options = options;
      this.#start();
    }

    #start() {
      if (this.#options.once) {
        this.#timerId = setTimeout(this.#options.fn, this.#options.time);
      } else {
        this.#timerId = setInterval(this.#options.fn, this.#options.time);
      }
    }

    destroy() {
      if (this.#timerId) {
        if (this.#options.once) {
          clearTimeout(this.#timerId as NodeJS.Timeout);
        } else {
          clearInterval(this.#timerId as NodeJS.Timeout);
        }
        this.#timerId = null;
      }
    }
  };
}

/**
 * 默认导出 TaskManager（兼容原有代码）
 */
export default TaskManager;