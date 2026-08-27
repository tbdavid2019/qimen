# Antigravity Agent Guidelines for 333 Divination Suite

This repository is a production-grade traditional Chinese divination & metaphysics suite ("333 一句提醒·照見當下"), encompassing Qimen Dunjia, Meihua Yishu, Bazi, Fengshui, Tarot, Yinyuan, and Answerbook.

---

## 🚨 Mandatory Directives (嚴格執行準則)

1. **嚴禁敷衍與閹割 (Zero Castrated Versions)**:
   - All divination modules must implement complete, authentic classical algorithms and full datasets (e.g. 100 sticks for Yinyuan, 78 cards for Tarot, 24 mountains & 9 periods for Fengshui, complete Shensha & Geju for Bazi, 5-hexagram holographic system & 384 Yao for Meihua, complete 18 Dun & Sanqi Liuyi for Qimen).
   - No mock/placeholders in production calculation paths.

2. **更新日誌約束 (Always Update CHANGELOG.md)**:
   - Whenever any feature, bug fix, prompt enhancement, or architecture change is made, **MANDATORILY** update `CHANGELOG.md` with an accurate dated entry (`YYYY-MM-DD`).

3. **測試與品質保證 (100% Test Pass Rate)**:
   - Always run `npm test` after changes and ensure 100% pass rate before reporting completion.
   - Node.js runtime only: Do not introduce Python runtime dependencies into the Vercel/Node serving path.

4. **文化素養與正向引導 (Professional Metaphysics Persona)**:
   - Adhere to the core motto: "傳統智慧，理性解讀；照見當下，指引行動".
   - Do not make absolute supernatural predictions or create fear/anxiety; empower the user with concrete, constructive next actions.
