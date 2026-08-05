# Work Review 上游差异清单

基线：`wm94i/Work-Review@5cae4bee67100f58319d32fe1cb31473089800a6`

本文件描述 Eye Review 相对上游的产品边界，防止“删除桌宠”被扩展成删除其他 Work Review 能力，也用于后续同步 `upstream/main` 时判断冲突。

## 保留

| 上游能力 | 处理原则 |
|---|---|
| 活动窗口、应用、窗口标题和浏览器 URL 采集 | 保留；护眼引擎可共享底层系统信号，但不复用活动统计的业务计时 |
| 截图、OCR、相似度去重、代表截图 | 保留；不得为周期回顾再启动第二套高频采集 |
| SQLite、时间线、统计、小时摘要、日报 | 保留；新增周期回顾是并列能力 |
| AI 问答、模型配置、本地与云端分析 | 保留；周期回顾不得扩大用户已授权的数据边界 |
| 隐私、存储、导出、本地 API、Bot、更新、开机启动 | 保留；只处理与桌宠直接耦合的引用 |
| 主窗口、托盘、轻量模式和录制开关 | 保留；休息期间限制退出只影响正在进行的休息 |

## 删除

### Rust 后端

- `src-tauri/src/avatar_engine.rs`
- `src-tauri/src/avatar_followup.rs`
- `src-tauri/src/avatar_input.rs`
- `src-tauri/src/avatar_proactive.rs`
- `src-tauri/src/commands/avatar.rs`
- `main.rs` 中的 Avatar 状态、后台循环、事件、托盘开关、命令注册和窗口初始化。
- `crates/core/src/config.rs` 中只服务于桌宠的字段、默认值、归一化和测试。
- Tauri capability 中的 `avatar` 窗口授权。
- Linux GNOME 桌宠输入扩展及其打包引用。

删除前必须逐项确认引用是否为桌宠专属；可被新护眼引擎复用的通用 Windows 空闲、锁屏、休眠或窗口监测能力迁入通用模块，不能随文件名一起丢弃。

### Svelte 前端与素材

- `src/routes/avatar/`
- `src/lib/components/Avatar/`
- `src/routes/settings/components/SettingsAvatar.svelte`
- `src/lib/utils/avatarToggle.js`
- Avatar 专属测试、路由、设置、文案和事件监听。
- BongoCat/桌宠图片、声音与第三方素材声明；删除声明前核实其是否仍被其他资产使用。

### 旧休息提醒

- `BreakReminderRuntime` 及桌宠气泡展示路径。
- “必须开启桌宠”的休息提醒设置。
- `break_reminder_*` 旧字段在完成配置迁移后退出运行时模型。

## 新增

- 独立护眼状态机及可注入时钟。
- Windows 锁定/解锁、休眠/唤醒和空闲信号的统一适配层。
- 每显示器休息窗口管理器与 watchdog。
- Svelte 休息页、预告、护眼设置和本轮回顾。
- 周期范围查询与确定性回顾；可选 AI 增强复用现有模型管线。
- 配置迁移、状态持久化、Overlay 排除及对应测试。

新增代码应尽量放在独立模块中，减少对 `main.rs`、共享配置和现有路由的侵入，降低以后同步上游的冲突成本。

## 替换关系

| 上游实现 | Eye Review 实现 |
|---|---|
| 桌宠气泡定时提醒 | 独立的预告、强制休息和等待返回流程 |
| 依赖桌宠和录制状态的提醒计时 | 独立于桌宠、截图、OCR、AI、网络和录制的护眼状态机 |
| Avatar 窗口/点击穿透 | 每显示器全屏输入拦截层 + 75%～80% 中央休息卡片 |
| 桌宠主动提醒与待跟进卡片 | 删除，不迁入护眼模块；工作助手等非桌宠入口保留 |
| `break_reminder_*` 配置 | 新护眼配置并提供确定性迁移 |

## 上游同步规则

1. 保留 `upstream` 指向 `https://github.com/wm94i/Work-Review.git`。
2. 同步前先阅读上游 changelog 和待合并提交，识别其是否修改本清单涉及区域。
3. 上游新增非桌宠能力默认保留；上游新增桌宠能力默认不引入。
4. 上游对活动采集、隐私、数据库、摘要或窗口生命周期的修复应评估并尽量吸收。
5. 上游若修改桌宠与共享模块的耦合点，必须按本规格重新判断，不能仅靠文本冲突是否消失来决定。
6. 每次同步后运行完整自动化测试，并在 Windows 重跑锁屏、睡眠、多屏、Overlay 排除和退出绕过的核心矩阵。
7. 不维护长期魔改补丁串；以独立模块、窄接口和本文件记录语义差异。

## 参考项目的使用边界

- [`drmowinckels/entracte`](https://github.com/drmowinckels/entracte)：参考 Tauri/Rust 调度、多显示器 Overlay、80% 居中窗口和 watchdog；不复制 React UI、Skip/Postpone 或未经 Windows 验证的平台实现。
- [`hovancik/stretchly`](https://github.com/hovancik/stretchly)：参考严格模式、自然休息、多屏和异常恢复的行为与测试案例；不引入 Electron 代码。
- [BreakTimer](https://github.com/tom-james-watson/breaktimer-app)、[Workrave](https://github.com/rcaelers/workrave) 和 [ActivityWatch](https://github.com/ActivityWatch/activitywatch)：只参考公开行为、问题与状态机思路，不复制 GPL 代码。
- EyeLoveU：只参考非版权化的交互概念，不使用其名称、代码、素材或界面复刻。
