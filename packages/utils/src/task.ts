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
  public static Timer = class Timer implements TimerTask {
    public timerId: NodeJS.Timeout | number | null = null;
    public options: TaskOptions;

    public constructor(options: TaskOptions) {
      this.options = options;
      this.start();
    }

    public start = () => {
      if (this.options.once) {
        this.timerId = setTimeout(this.options.fn, this.options.time);
      } else {
        this.timerId = setInterval(this.options.fn, this.options.time);
      }
    };

    public stop = () => {
      if (this.timerId !== null) {
        if (this.options.once) {
          clearTimeout(this.timerId);
        } else {
          clearInterval(this.timerId);
        }
        this.timerId = null;
      }
    };

    public destroy() {
      if (this.timerId !== null) {
        if (this.options.once) {
          clearTimeout(this.timerId);
        } else {
          clearInterval(this.timerId);
        }
        this.timerId = null;
      }
    }
  };
}

/**
 * 默认导出 TaskManager（兼容原有代码）
 */
export default TaskManager;
