# openGym 千岛小程序版 — 第三方声明

本文件继承自上游 openGym 项目（Duarte Santos, AGPL-3.0），
根据本次迁移实际保留/替换情况更新。

## 1. openGym 原始代码

openGym 原始项目 — Copyright (C) 2026 Duarte Santos.
openGym 自身代码以 **GNU AGPL v3.0** 发布（见 LICENSE）。

上游仓库：https://github.com/DuarteSantos8/openGym

本次迁移改动：将 React 19 + Zustand + Vite 前端重写为
Taro 4 + Vue 3 + Pinia，以适配千岛小程序运行时。
所有新增/修改代码以相同的 AGPL-3.0 发布。

---

## 2. App Store 例外（AGPL §7 额外许可）

上游 openGym 在 NOTICE.md 中声明：

> As an additional permission under section 7 of the AGPL v3.0, the copyright holder permits
> distribution of the openGym mobile application through app store platforms (such as the
> Apple App Store and Google Play) whose terms of service would otherwise be incompatible
> with the AGPL, provided the corresponding source code remains available under the AGPL at
> the project repository.

本项目迁移至**千岛小程序**平台（字节跳动托管式应用商店）进行分发。
本平台未在上游声明中被明确列举，但属于同类托管应用商店形态。
在以下条件下使用本例外进行分发：

1. 本项目完整源代码持续以 AGPL-3.0 在公开仓库发布；
2. 小程序内提供可访问的源代码仓库入口。

如需在非上述条件下分发，应联系 openGym 原作者确认。

---

## 3. ⚠️ Exercise 演示媒体 — 已剥离，非开源

上游 openGym 的 `catalogue/media/` 下的动作静态图和动画
由 **Gym visual (Aliaksandr Makatserchyk, gymvisual.com)** 授权给 openGym 使用，
**不属于 openGym 的 AGPL-3.0 范围**。

上游 NOTICE.md 明确声明：
> "They are not covered by openGym's AGPL and not by any licence of the exercise text below."
> "Third parties have no rights to reuse, extract, or integrate these media assets into
> independent apps, websites, or commercial products."

### 本次迁移的处理

本项目 **不包含任何 Gym visual 的演示图或动画**。
`catalogue/exercises.js` 中的每条动作条目带有一个 `mediaNote` 字段，
标注该位置需要替换为：
  - 你自己拍摄/绘制的演示素材，或
  - 从 gymvisual.com 购买的授权素材

### 合规建议

- 纯个人/本地使用：可先不上传演示媒体；
- 计划商业或广泛分发：**必须**从 gymvisual.com 获取授权，或自行制作素材；
- 禁止：从 openGym 上游仓库或其发布产物中提取演示媒体。

---

## 4. 人体肌肉绘图数据（body-paths.js）

openGym 原项目的人体肌肉绘图 SVG 路径（`frontend/src/lib/body-paths.js`）
源自 **MuscleMap** (https://github.com/melihcolpan/MuscleMap) by Melih Colpan，
以 **MIT License** 发布。

MIT License 完整文本见上游 NOTICE.md。

本迁移版当前未使用 body map 功能；如后续引入，需保留 MIT 版权声明。

---

## 5. 动作文本（名称、肌肉、描述、说明）

上游 catalogue 中的文本条目：
- 1,324 条早期数据源自 **ExerciseDB v1** (https://exercisedb.dev/)
  by AscendAPI，经 hasaneyldrm/exercises-dataset 以 **MIT License** 传入；
- 新增条目由 openGym 社区贡献，以 **AGPL-3.0** 发布。

本迁移版 `catalogue/exercises.js` 收录的动作文本遵循上述来源区分。

MIT License（ExerciseDB v1 / Hasan Emir Yıldırım）：
```
Copyright (c) 2026 Hasan Emir Yıldırım
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction... (完整文本见上游 NOTICE.md)
```

---

## 6. QR / 扫码相关库（本次迁移未使用）

openGym 原项目的 QR 码渲染和扫码功能使用：
- lean-qr (David Evans, MIT License)
- jsQR (Cosmo Wolfe, Apache License 2.0)
- @capacitor-mlkit/barcode-scanning (Apache License 2.0)

本次迁移版（千岛小程序 MVP）未集成 QR 功能。
如后续引入，需按上游 NOTICE.md 保留对应许可证声明。

---

## 7. 本项目新增的第三方依赖

| 依赖 | 许可证 | 说明 |
|------|--------|------|
| Taro 4 (open.dragonballjs.com) | MIT | 小程序跨端框架 |
| Vue 3 | MIT | 前端框架 |
| Pinia | MIT | 状态管理 |
| taro-plugin-qd | - | 千岛平台 Taro 适配插件 |

各依赖的许可证文本见其 npm 包自身声明。

---

最后更新：2026-10-26
