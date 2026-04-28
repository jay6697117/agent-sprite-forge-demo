# 星露谷风格农场游戏 MVP 实施计划

## Context

用户想在 `/Users/zhangjinhui/Desktop/agent-sprite-forge-demo` 中开发一个“星露谷物语风格”的 MVP，并明确要求使用项目内的 `generate2dsprite` 和 `generate2dmap` 两个 skill 生成美术资产和地图。

当前项目状态很轻：`README.md` 只有两个 skill 使用示例；根目录没有 `package.json`、`src`、游戏运行时代码；`assets/map`、`assets/sprites`、`data` 基本为空。因此推荐先做一个原创的浏览器版小农场 MVP，不复刻原作素材、角色、地图或 UI，只保留“俯视像素农场、种植、NPC 商店、保存进度”的核心体验。

预期结果：玩家打开浏览器即可游玩；能移动、碰撞、交互、种植、浇水、睡觉推进天数、收获、买卖种子/作物，并能刷新页面后继续。

## 执行顺序要求

实施开始后，第一步先把本计划保存到当前项目目录：

- `/Users/zhangjinhui/Desktop/agent-sprite-forge-demo/MVP_PLAN.md`

保存计划后，再开始生成资产、生成地图和编写游戏代码。

## 推荐技术方案

使用：

- Phaser 3：负责 2D 精灵、动画、输入、摄像机、渲染顺序、碰撞。
- TypeScript：让地图数据、存档数据、物品数据结构清晰。
- Vite：快速启动浏览器开发环境。
- `localStorage`：保存 MVP 的金币、背包、天数、作物状态、玩家位置。
- `layered_raster + y_sorted_props + precise_shapes + trigger_zones`：作为地图管线。

不要第一阶段就做完整 tilemap 编辑器、小镇大地图、季节系统、任务系统、战斗系统、复杂 UI。MVP 第一版只做一张农场地图、一个 NPC、一种作物、一套最小经济循环。

## MVP 功能范围

第一版必须完成：

1. 玩家出现在农场地图。
2. WASD/方向键移动。
3. 玩家播放四方向行走动画。
4. 房屋、水塘、树、栅栏、地图边界阻挡玩家。
5. 玩家进入交互区时显示提示。
6. 玩家可在固定农田格子播种一种作物。
7. 玩家可浇水。
8. 睡觉/下一天后，已浇水作物成长。
9. 成熟作物可收获。
10. 一个 NPC 小摊可以买种子、卖作物。
11. 金币、背包、天数、作物状态可保存。
12. 刷新页面后状态恢复。

第一版不做：

- 不做原作地图/角色/名称复刻。
- 不做多人联机。
- 不做复杂季节、天气、钓鱼、采矿、任务线。
- 不做第二张小镇地图，商店先放在农场里的 NPC 小摊。

## Agent Team 分工

本任务适合轻量 agent team，不需要大型企业级调度。

### 1. Team Lead / Main Controller

职责：

- 控制 MVP 范围。
- 冻结尺寸、数据结构、目录结构。
- 调用和协调 `generate2dsprite`、`generate2dmap`。
- 审查各阶段交付物是否能接入运行时。

### 2. Art Pipeline Agent

建议 agent：`general-purpose`，专门负责资产生成流程。

职责：

- 使用 `/generate2dsprite` 生成玩家、NPC、作物、物品图标。
- 检查透明背景、网格、帧尺寸、方向顺序、`pipeline-meta.json`。
- 不合格时重生成或重新后处理。

交付路径：

- `assets/sprites/player_farmer/sheet-transparent.png`
- `assets/sprites/npc_seed_seller/sheet-transparent.png`
- `assets/sprites/crop_turnip/sheet-transparent.png`
- `assets/sprites/items_farming/sheet-transparent.png`

### 3. Map Pipeline Agent

建议 agent：`general-purpose`，专门负责地图生成流程。

职责：

- 使用 `/generate2dmap` 生成农场主地图。
- 输出 layered raster 图层、props、placement JSON、collision JSON、zones JSON、preview。
- 确保碰撞和交互区是结构化 JSON，不从图片自动推断。

交付路径：

- `assets/map/farm/farm-base.png`
- `assets/map/farm/farm-layered-preview.png`
- `data/farm-props.json`
- `data/farm-collision.json`
- `data/farm-zones.json`

### 4. Runtime Agent

建议 agent：`frontend-developer`。

职责：

- 建立 Vite + Phaser + TypeScript 项目。
- 实现玩家、地图加载、碰撞、交互、农耕、商店、保存。
- 接入 Art Pipeline 和 Map Pipeline 的产物。

关键代码路径：

- `package.json`
- `index.html`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.ts`
- `src/scenes/PreloadScene.ts`
- `src/scenes/FarmScene.ts`
- `src/scenes/UIScene.ts`
- `src/objects/Player.ts`
- `src/objects/Npc.ts`
- `src/objects/CropPlot.ts`
- `src/systems/CollisionSystem.ts`
- `src/systems/InteractionSystem.ts`
- `src/systems/FarmingSystem.ts`
- `src/systems/InventorySystem.ts`
- `src/systems/ShopSystem.ts`
- `src/systems/SaveSystem.ts`

### 5. QA Agent

建议 agent：`qa-engineer`。

职责：

- 资产 QC。
- 地图碰撞和 zones QC。
- 浏览器内完整玩法冒烟测试。
- 检查刷新保存恢复。
- 检查生产构建。

## 资产生成计划

### 玩家角色

使用 `/generate2dsprite`：

- 目标：原创农夫主角。
- 风格：温暖乡村像素风，俯视 3/4 RPG overworld。
- sheet：4x4。
- 帧尺寸：32x48。
- sheet 尺寸：128x192。
- 行顺序：down、left、right、up。
- 列顺序：neutral、left foot、neutral、right foot。
- 背景：纯 `#FF00FF`。
- 输出目录：`assets/sprites/player_farmer`。

后处理复用：

- `.claude/skills/generate2dsprite/scripts/generate2dsprite.py`
- 使用 `process --target player --mode player_sheet --shared-scale --align feet --reject-edge-touch`。

### NPC

使用 `/generate2dsprite`：

- 目标：原创种子商人 NPC。
- sheet：4x4，方便后续扩展；MVP 可只使用朝下静止帧。
- 帧尺寸：32x48。
- 输出目录：`assets/sprites/npc_seed_seller`。

### 作物

使用 `/generate2dsprite`：

- 目标：原创芜菁/萝卜类作物。
- sheet：1x4。
- 帧尺寸：32x32。
- 阶段：seedling、sprout、grown、harvestable。
- 输出目录：`assets/sprites/crop_turnip`。

### 工具和物品图标

使用 `/generate2dsprite`：

- sheet：1x4。
- 帧尺寸：32x32。
- 顺序：hoe、watering_can、turnip_seed、turnip_crop。
- 输出目录：`assets/sprites/items_farming`。

### 资产 QC 标准

检查：

- `sheet-transparent.png` 存在。
- 透明图中没有残留 `#FF00FF` 背景。
- 没有文字、UI、边框、标签。
- 角色所有帧同身份、同尺度、同光照。
- 角色没有触碰 cell 边缘。
- `pipeline-meta.json` 与目标 rows/cols/mode 匹配。

参考文件：

- `.claude/skills/generate2dsprite/SKILL.md`
- `.claude/skills/generate2dsprite/references/prompt-rules.md`

## 地图生成计划

使用 `/generate2dmap` 生成第一张也是唯一一张 MVP 主地图：农场。

推荐参数：

- visual model：`layered_raster`
- runtime object model：`y_sorted_props + interactive_entities`
- collision model：`precise_shapes + trigger_zones`
- engine target：`Phaser / project-native JSON`
- 画布：1280x960。
- 网格：32px。
- 逻辑尺寸：40x30 tiles。

地图内容：

- 玩家出生点。
- 农舍。
- 固定农田 4x3 或 5x4。
- NPC 种子小摊。
- 水塘。
- 树木。
- 栅栏。
- 土路。
- 邮箱/公告牌。
- 睡觉/下一天入口。

地图产物：

- `assets/map/farm/farm-base.png`：地面、草地、道路、水面、农田底图。
- `assets/map/farm/farm-layered-preview.png`：QA 预览图。
- `assets/props/...`：树、房屋、栅栏、小摊等透明 props。
- `data/farm-props.json`：props 摆放坐标和 `sortY`。
- `data/farm-collision.json`：阻挡矩形/椭圆。
- `data/farm-zones.json`：交互区、农田区、睡觉区、商店区。

复用工具：

- `.claude/skills/generate2dmap/scripts/extract_prop_pack.py`：从纯 `#FF00FF` prop sheet 提取透明 props。
- `.claude/skills/generate2dmap/scripts/compose_layered_preview.py`：根据 base map 和 placement JSON 合成预览。
- `.claude/skills/codex-gateway-imagegen/scripts/generate_gateway_image.py`：由 skill 内部通过 gateway 生成原始图片。

地图规则：

- base map 只放地面层，不烘焙房屋、树、NPC、文字、UI。
- tall props 单独生成透明图片。
- 碰撞区域手工写 JSON，不用透明 PNG 边界自动当碰撞。
- 阻挡物只挡“底座”，不要用整棵树冠阻挡。
- 玩家出生点必须不在碰撞体中。
- 农田格子必须和视觉农田对齐。

参考文件：

- `.claude/skills/generate2dmap/SKILL.md`
- `.claude/skills/generate2dmap/references/map-strategies.md`
- `.claude/skills/generate2dmap/references/layered-map-contract.md`

## 数据结构计划

### `data/farm-collision.json`

建议结构：

```json
{
  "mapSize": { "width": 1280, "height": 960 },
  "spawn": { "x": 640, "y": 720 },
  "blockers": [
    { "id": "farmhouse", "type": "rect", "x": 120, "y": 120, "w": 220, "h": 150 },
    { "id": "pond", "type": "ellipse", "x": 950, "y": 640, "rx": 120, "ry": 80 }
  ]
}
```

### `data/farm-zones.json`

建议结构：

```json
{
  "zones": [
    { "id": "npc_shop", "kind": "shop", "type": "rect", "x": 760, "y": 430, "w": 120, "h": 90 },
    { "id": "sleep", "kind": "next_day", "type": "rect", "x": 190, "y": 300, "w": 80, "h": 60 }
  ],
  "fieldPlots": [
    { "id": "plot_01", "x": 420, "y": 520, "w": 32, "h": 32 }
  ]
}
```

### 存档结构

保存在 `localStorage`：

```ts
type GameSave = {
  version: 1;
  day: number;
  gold: number;
  inventory: {
    turnipSeed: number;
    turnipCrop: number;
  };
  player: { x: number; y: number; facing: 'down' | 'left' | 'right' | 'up' };
  plots: Record<string, {
    cropId: 'turnip' | null;
    stage: number;
    wateredToday: boolean;
  }>;
};
```

## 运行时代码实施步骤

### Phase 1：初始化项目

创建：

- `package.json`
- `index.html`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.ts`

安装依赖：

- `phaser`
- `typescript`
- `vite`

脚本：

- `npm run dev`
- `npm run build`
- `npm run preview`

### Phase 2：基础场景

创建：

- `src/scenes/PreloadScene.ts`
- `src/scenes/FarmScene.ts`
- `src/scenes/UIScene.ts`

功能：

- 加载玩家、NPC、作物、物品 sheet。
- 加载地图 PNG 和 JSON。
- 显示 farm base map。
- 设置 pixelArt/nearest 渲染。

### Phase 3：玩家移动和碰撞

创建：

- `src/objects/Player.ts`
- `src/systems/CollisionSystem.ts`

功能：

- WASD/方向键移动。
- 四方向 walk 动画。
- 停止时保持最后朝向。
- 玩家碰撞体只使用脚底区域。
- 从 `data/farm-collision.json` 创建阻挡体。
- 摄像机跟随并限制在地图边界内。

### Phase 4：交互和 UI

创建：

- `src/systems/InteractionSystem.ts`
- `src/objects/Npc.ts`

功能：

- 从 `data/farm-zones.json` 读取 zones。
- 玩家进入 zone 后显示提示。
- E 键触发 NPC 商店或睡觉下一天。
- UI 显示天数、金币、种子数、作物数、当前工具。

### Phase 5：农耕系统

创建：

- `src/objects/CropPlot.ts`
- `src/systems/FarmingSystem.ts`
- `src/systems/InventorySystem.ts`

规则：

- 初始金币 20。
- 初始种子 5。
- 种子价格 5。
- 作物售价 8。
- 作物需要 3 次“浇水后睡觉”成熟。
- 未浇水则睡觉后不成长。
- 成熟后可收获并清空地块。

操作：

- `1` 选择种子。
- `2` 选择水壶。
- `3` 选择收获/手。
- `E` 交互。

### Phase 6：商店和保存

创建：

- `src/systems/ShopSystem.ts`
- `src/systems/SaveSystem.ts`

功能：

- 买 1 个种子：金币减少，种子增加。
- 卖 1 个作物：作物减少，金币增加。
- 金币不足或物品不足时不改变状态。
- 播种、浇水、睡觉、收获、买卖后保存。
- 页面刷新后恢复。
- 提供重置存档入口，方便测试。

## 验证计划

### 资产验证

- 检查所有 `sheet-transparent.png` 是否存在。
- 检查透明背景是否干净。
- 检查玩家/NPC sheet 是否为 4x4。
- 检查作物/物品 sheet 是否为 1x4。
- 检查 `pipeline-meta.json` 是否可读。
- 检查没有文字、UI、标签、水印。

### 地图验证

- 检查 base map 尺寸为 1280x960。
- 检查 preview 能正确合成。
- 检查 `data/farm-props.json` 可解析，引用的 prop 图片都存在。
- 检查 `data/farm-collision.json` 可解析。
- 检查 `data/farm-zones.json` 可解析。
- 检查 spawn 不在 blocker 内。
- 检查 farm plots 与视觉农田对齐。
- 检查 NPC shop zone、sleep zone 可到达。

### 代码验证

运行：

- `npm run build`
- `npm run dev`

浏览器测试：

1. 打开 dev server。
2. 地图显示。
3. 玩家显示。
4. 玩家可移动。
5. 玩家动画方向正确。
6. 玩家不能穿过房子、水塘、树、栅栏、边界。
7. 靠近 NPC 出现提示。
8. 按 E 打开商店。
9. 购买种子。
10. 到农田播种。
11. 浇水。
12. 进入睡觉区，下一天。
13. 重复直到成熟。
14. 收获。
15. 出售作物。
16. 刷新页面，确认金币、背包、作物、天数恢复。
17. `npm run build` 后 `npm run preview` 再跑一遍核心流程。

### 完成标准

MVP 视为完成，当且仅当：

- 浏览器能运行。
- 玩家能移动和碰撞。
- 地图、角色、NPC、作物、物品图标均来自项目生成流程或原创实现。
- 一种作物完整完成“买种子 -> 播种 -> 浇水 -> 睡觉成长 -> 收获 -> 出售”。
- 状态可以保存和恢复。
- 控制台没有阻塞性错误。
- 生产构建通过。

---

# 农场游戏 MVP+ 深度可玩与美术升级实施计划

## Context

当前项目已经具备可运行的基础 MVP：Phaser 3 + TypeScript + Vite，玩家可移动、碰撞、播种、浇水、睡觉成长、收获、买卖种子/作物，并通过 `localStorage` 保存进度。

用户反馈基础版本“太简单”：商店和房子模型过于简陋，左上角操作提示像调试文本，播种/浇水/收获缺少对应手势和动作，整体缺少深度玩法闭环和精美视觉。因此下一阶段不是重写 MVP，而是在现有代码上升级成更像完整小游戏的 MVP+：更漂亮的地图与建筑、更清晰的 UI、更有反馈的角色动作、更耐玩的每日经营循环。

目标结果：玩家打开浏览器后能体验一个 15-30 分钟的小农场循环：早上查看订单和体力，种植/浇水/收获，完成订单赚钱，去更精美的商店购买种子和升级，睡觉结算并进入下一天；所有关键操作都有角色动作、音画反馈、UI 提示和存档恢复。

## 关键约束

- 美术方向参考《星露谷物语》的温暖乡村像素氛围、柔和配色、可爱建筑比例和清晰轮廓，但所有角色、建筑、地图、UI、图标必须原创，不能复刻原作素材、角色、地图布局或 UI。
- 继续使用项目内 `generate2dsprite` 和 `generate2dmap` skill 生成美术资产和地图。
- 保留现有 Phaser/Vite/TypeScript 架构，不切换引擎。
- 优先改现有文件，避免无意义新增抽象。
- 先做最能改善体验的内容：UI、动作反馈、美术升级、订单/体力/升级闭环。
- 播种、浇水、收获、对话、睡觉必须在画面上看得出玩家正在做不同操作，不能只改数值或只弹文字。
- 提示、按钮、订单卡、商店窗口要做成好看可爱的像素 UI，而不是左上角调试文本。
- 需要兼容或迁移已有 `localStorage` 存档，不能因为新增字段导致旧存档白屏。

## 推荐实施顺序

### Phase 0：同步升级计划到项目目录

实施开始后的第一步，把本计划同步到当前项目：

- `/Users/zhangjinhui/Desktop/agent-sprite-forge-demo/MVP_PLAN.md`

保留已有 MVP 计划内容，并追加“MVP+ 升级计划”章节，方便后续执行时有明确依据。

### Phase 1：扩展数据模型和存档迁移

优先把玩法数据变成可扩展结构，避免后面 UI、商店、订单、升级写死。

修改/复用路径：

- `src/types/GameState.ts`
- `src/types/MapData.ts`
- `src/systems/SaveSystem.ts`
- `src/config/crops.ts`
- `src/config/items.ts`

新增或扩展的数据：

- 作物：萝卜、小麦、草莓。
- 体力：每天固定体力，播种/浇水/收获消耗体力，睡觉恢复。
- 订单：每天 2 个随机订单，要求提交指定作物，完成后奖励金币和声望。
- 升级：水壶容量、背包容量、农田上限、鞋子移速。
- NPC 好感：先实现种子商人好感，后续可扩展。
- 解锁：订单声望达到门槛后解锁林地小路或新商品。

复用现有能力：

- `SaveSystem.load()`：在这里做版本迁移和默认字段补齐。
- `SaveSystem.save()`：继续作为所有系统的保存入口。
- `StartingInventory`：扩展初始金币、种子、体力。
- `TURNIP`：升级为多作物配置表。

### Phase 2：升级 UI，替换简陋左上角文字

先让玩家“看得懂、愿意玩”。把 `UIScene` 从简单文字改为 Phaser UI 容器。

修改路径：

- `src/scenes/UIScene.ts`
- `src/scenes/FarmScene.ts`
- `src/config/controls.ts`

UI 内容：

- 顶部状态栏：第几天、金币、体力、当前天气/提示，使用圆角木牌/羊皮纸风格像素面板。
- 底部工具栏：种子、水壶、手、后续锄头/斧头，显示快捷键、选中高亮、轻微弹跳动画。
- 右侧订单卡：今日订单、进度、奖励、完成状态，做成可爱的公告板便签样式。
- 中下方消息气泡：播种成功、体力不足、订单完成、金币变化，使用短句、柔和底色、小图标，不再像调试日志。
- NPC/睡觉/商店交互气泡：靠近时在角色附近显示，不只在左上角显示，气泡要有小箭头和轻微浮动。
- 商店窗口：木框像素面板，商品卡、价格、库存、购买/出售提示，视觉上像温暖小店菜单。

实现方式：

- 使用 Phaser `Container`、`Rectangle`、`Text`、`Image` 组合，不引入额外 UI 框架。
- 继续通过 `this.game.events.emit('ui:update', ...)` 更新 UI。
- 扩展 `ui:update` payload，包含 energy、orders、selectedTool、shop state、message queue。

### Phase 3：加入玩家动作状态机和操作反馈

现在 `Player.update()` 只处理移动和行走动画；下一阶段要加入 tool/action 状态，操作时短暂锁定移动，动作完成后再结算玩法效果。

修改/复用路径：

- `src/objects/Player.ts`
- `src/scenes/FarmScene.ts`
- `src/scenes/PreloadScene.ts`
- `src/systems/FarmingSystem.ts`
- `src/objects/CropPlot.ts`

新增建议文件：

- `src/systems/PlayerActionSystem.ts`
- `src/systems/EffectSystem.ts`

动作状态：

- `idle`
- `walk`
- `plant`
- `water`
- `harvest`
- `talk`
- `shop`
- `sleep`

动作规则：

- 按 E 后先播放动作，动作期间短暂锁定移动，让玩家明确看到自己在干什么。
- 播种动作：角色弯腰撒种，地面出现小种子/土尘，动作完成时才真正扣种子并种下。
- 浇水动作：角色举起水壶，水滴落到目标地块，动作完成时才设置 `wateredToday`。
- 收获动作：角色伸手采摘，成熟作物弹起并飞向 HUD，动作完成时才增加作物并清空地块。
- 对话动作：角色面向 NPC，NPC 头顶出现可爱对话气泡。
- 睡觉动作：角色进入农舍门口，屏幕淡黑，显示“晚安，第 N 天结束”。

特效反馈：

- 播种：土尘/小种子落地。
- 浇水：水滴弧线和湿润地块高亮。
- 收获：星光闪烁、作物飞向 HUD。
- 买卖：金币飞入/飞出 UI。
- 睡觉：屏幕淡黑、显示“第 N 天”。

### Phase 4：使用 generate2dsprite 生成高质量角色动作和 UI/FX 资产

继续使用 `.claude/skills/generate2dsprite`，原始图片通过 `codex-gateway-imagegen` 生成，再用脚本后处理为透明 sheet。

输出路径建议：

- `assets/sprites/player_farmer_v2/walk/sheet-transparent.png`
- `assets/sprites/player_farmer_v2/plant/sheet-transparent.png`
- `assets/sprites/player_farmer_v2/water/sheet-transparent.png`
- `assets/sprites/player_farmer_v2/harvest/sheet-transparent.png`
- `assets/sprites/player_farmer_v2/talk/sheet-transparent.png`
- `assets/sprites/npc_seed_seller_v2/sheet-transparent.png`
- `assets/sprites/crops_v2/sheet-transparent.png`
- `assets/sprites/items_v2/sheet-transparent.png`
- `assets/sprites/fx_farming/sheet-transparent.png`
- `assets/sprites/ui_icons/sheet-transparent.png`

规格建议：

- 总体风格：参考《星露谷物语》的温暖、可爱、清晰像素美术观感，但提示词必须要求原创角色、原创建筑、原创 UI，不复制任何原作具体设计。
- 玩家动作：4 方向，每方向 6 帧，推荐 64x64 cell；播种、浇水、收获要有明显不同身体姿势和手部动作。
- NPC：4 方向 idle/talk，推荐 64x64 cell；种子商人要比当前版本更有职业特征，比如围裙、种子袋、暖色帽子。
- 作物：每种作物 4 阶段，32x32 cell；成熟阶段要饱满可爱，便于玩家一眼识别。
- FX：水滴、土尘、收获星光、金币飞入，32x32 或 64x64 cell；特效要轻快，不遮挡角色。
- UI 图标：金币、体力、订单、种子、作物、工具，32x32 cell；图标要圆润、可爱、边缘清晰。

接入点：

- `src/config/assets.ts`：新增 v2 asset key 和 frame size。
- `src/scenes/PreloadScene.ts`：加载 v2 sheet 并创建动作动画。
- `src/objects/Player.ts`：根据动作状态播放对应动画。

### Phase 5：使用 generate2dmap 重做精美农场地图和建筑 props

现有地图能玩，但建筑/商店偏简单。下一阶段使用 `.claude/skills/generate2dmap` 生成更完整的 warm village farm 风格地图。

输出路径建议：

- `assets/map/farm_v2/farm-base.png`
- `assets/map/farm_v2/farm-layered-preview.png`
- `assets/props/farm_v2/farmhouse.png`
- `assets/props/farm_v2/seed_shop.png`
- `assets/props/farm_v2/notice_board.png`
- `assets/props/farm_v2/well.png`
- `assets/props/farm_v2/tree_oak.png`
- `assets/props/farm_v2/fence_pack.png`
- `data/farm-v2-props.json`
- `data/farm-v2-collision.json`
- `data/farm-v2-zones.json`

地图内容：

- 整体氛围：温暖乡村像素农场，参考《星露谷物语》的舒适感和丰富装饰密度，但地图布局、建筑造型、色彩组合必须原创。
- 更精美农舍：暖木梁、红陶瓦、烟囱、花箱、门口睡觉区，外形要比当前简单房子更有层次。
- 更精美商店：绿色遮阳棚、木质招牌、种子袋、盆栽、柜台，看起来像真正的小店而不是临时摊位。
- 公告板广场：承载每日订单，周围有木牌、花坛、路灯、石板路。
- 农田区：整齐田垄，支持后续扩展地块，播种/浇水后视觉状态明显变化。
- 水井/池塘：后续可作为补水点，水面要有柔和高光。
- 林地入口：先做锁住的视觉入口，订单声望达到门槛后解锁。
- 装饰：路灯、木牌、桶、箱子、花坛、围栏、树丛，提高地图精致度和生活感。

接入点：

- `src/config/assets.ts`：增加 farm v2 asset key。
- `src/scenes/FarmScene.ts`：读取 farm v2 JSON，继续复用 `loadProps()` 和 `renderProps()`。
- `src/systems/CollisionSystem.ts`：继续读取结构化 blockers。
- `src/systems/InteractionSystem.ts`：继续读取 zones。

### Phase 6：实现订单、体力、升级、NPC 好感和解锁闭环

新增系统建议：

- `src/systems/OrderSystem.ts`
- `src/systems/EnergySystem.ts`
- `src/systems/UpgradeSystem.ts`
- `src/systems/NpcSystem.ts`
- `src/systems/UnlockSystem.ts`

核心玩法闭环：

1. 每天早上生成 2 个订单。
2. 玩家根据订单选择种植作物。
3. 播种、浇水、收获消耗体力。
4. 完成订单获得金币、声望、NPC 好感。
5. 金币可购买种子和升级。
6. 升级提升效率：更多水量、更大背包、更多田地、更快移动。
7. 声望达到门槛后解锁新商品或林地入口。
8. 睡觉进入下一天，订单刷新，作物成长，体力恢复。

优先级：

- 先做订单 + 体力 + 商店升级。
- 再做 NPC 好感和地图解锁。
- 不在本阶段做复杂剧情、钓鱼、战斗、矿洞。

### Phase 7：整合、验收和打磨

必须验证：

- `npm run build` 通过。
- `npm run dev` 可正常启动。
- 浏览器控制台无阻塞性错误。
- 首次打开新存档可玩。
- 旧 MVP 存档能迁移或安全重置为默认结构。
- UI 面板不挡住核心操作区域。
- 玩家移动、碰撞、镜头跟随正常。
- 播种、浇水、收获都有动作和特效。
- 订单能生成、完成、给奖励、保存、刷新后恢复。
- 体力不足时不能继续消耗型操作，并有明确提示。
- 商店可以买种子、卖作物、买升级。
- 睡觉后天数、体力、作物成长、订单刷新正确。
- farm v2 地图中房屋、水塘、树、围栏、商店碰撞正确。
- farm v2 的 shop zone、sleep zone、notice board zone 可到达。

浏览器验收路线：

1. 重置存档。
2. 查看 HUD、工具栏、订单卡是否显示。
3. 移动到农田，播种并确认角色播种动作和土尘效果。
4. 切换水壶，浇水并确认水滴效果和体力减少。
5. 睡觉到下一天，确认淡入淡出和天数变化。
6. 重复直到作物成熟，收获并确认作物飞入 HUD。
7. 到公告板或订单卡提交订单，确认金币/声望奖励。
8. 到商店购买种子或升级，确认 UI 和数值变化。
9. 刷新页面，确认金币、体力、订单、作物、升级、玩家位置恢复。
10. 运行生产构建和 preview，再走一遍核心流程。

## 完成标准

MVP+ 视为完成，当且仅当：

- 游戏仍能稳定运行并通过生产构建。
- 地图、建筑、商店、NPC、UI 不再像临时占位。
- 播种、浇水、收获至少有对应玩家动作和基础特效。
- 左上角简陋文字被完整 HUD、工具栏、订单卡、交互气泡替代。
- 至少 3 种作物、每日订单、体力、基础升级形成 15-30 分钟可玩循环。
- 存档能保存并恢复新增玩法数据。
- 使用 `generate2dsprite` 和 `generate2dmap` 产出的新资产/地图已实际接入运行时。
