<template>
  <view class="legal-page">
    <view class="legal-card">
      <text class="legal-title">ManLog 用户协议</text>
      <text class="legal-meta">更新日期：2026 年 8 月 11 日</text>
      <view class="draft-notice">
        本页面为开发阶段协议草案，正式发布前仍需结合运营主体、服务范围和适用规则完成审核。
      </view>

      <view class="section">
        <text class="section-title">1. 服务说明</text>
        <text class="paragraph">ManLog 提供个人事件记录、历史管理和统计展示功能，帮助用户进行长期自我观察。服务内容不构成医疗诊断、治疗建议或其他专业意见。</text>
      </view>
      <view class="section">
        <text class="section-title">2. 使用条件</text>
        <text class="paragraph">你应当基于真实、自愿的目的使用本服务，并妥善保管登录设备和会话信息。不得利用本服务实施违法活动、攻击系统、干扰他人或尝试访问不属于自己的数据。</text>
      </view>
      <view class="section">
        <text class="section-title">3. 个人记录</text>
        <text class="paragraph">你对自己提交的记录内容负责。请避免填写与核心功能无关的身份证件、联系方式、财务账户或他人隐私等信息。你可以在产品提供的范围内查看、编辑和删除记录。</text>
      </view>
      <view class="section">
        <text class="section-title">4. 服务变更</text>
        <text class="paragraph">在维护、升级、安全处置或不可抗力情况下，服务可能暂时中断。我们会在合理范围内改进功能和安全措施，并在重要变更发生时更新相关说明。</text>
      </view>
      <view class="section">
        <text class="section-title">5. 责任边界</text>
        <text class="paragraph">统计结果只反映已记录的数据，可能受到遗漏、输入误差和统计口径影响。你不应仅依赖本服务作出医疗或其他高风险决定；如有健康疑问，应咨询有资质的专业人士。</text>
      </view>
      <view class="section">
        <text class="section-title">6. 协议更新</text>
        <text class="paragraph">当服务内容或适用规则变化时，我们可能更新本协议。继续使用前，你应当阅读更新后的内容；涉及重要权利义务变化时，应提供合理提示。</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.legal-page {
  min-height: 100vh;
  padding: 16px;
  box-sizing: border-box;
  background: $bg-page;
}

.legal-card {
  padding: 20px 18px 28px;
  border: 1px solid $border;
  border-radius: 16px;
  background: $bg-card;
}

.legal-title,
.legal-meta,
.section-title,
.paragraph {
  display: block;
}

.legal-title {
  color: $text-primary;
  font-size: 24px;
  font-weight: 800;
}

.legal-meta {
  margin-top: 6px;
  color: $text-placeholder;
  font-size: 12px;
}

.draft-notice {
  margin-top: 16px;
  padding: 12px;
  border-radius: 10px;
  color: $warning;
  background: #fff7ed;
  font-size: 13px;
  line-height: 20px;
}

.section {
  margin-top: 22px;
}

.section-title {
  color: $text-primary;
  font-size: 16px;
  font-weight: 700;
}

.paragraph {
  margin-top: 8px;
  color: $text-secondary;
  font-size: 14px;
  line-height: 24px;
  text-align: justify;
}
</style>
