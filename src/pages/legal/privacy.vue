<template>
  <view class="legal-page">
    <view class="legal-card">
      <text class="legal-title">ManLog 隐私政策</text>
      <text class="legal-meta">更新日期：2026 年 8 月 11 日</text>
      <view class="draft-notice">
        本页面为开发阶段隐私文本草案，正式发布前仍需根据实际运营主体、部署环境和微信平台要求完成审核。
      </view>

      <view class="section">
        <text class="section-title">1. 我们处理的信息</text>
        <text class="paragraph">ManLog 仅围绕个人记录与统计功能处理必要信息，包括微信登录产生的用户标识、事件日期与时间、事件类型、备注以及服务运行所需的基础日志。</text>
      </view>
      <view class="section">
        <text class="section-title">2. 信息用途</text>
        <text class="paragraph">这些信息用于建立登录会话、保存和管理个人记录、生成周/月/年统计、保障账户与服务安全，以及排查服务故障。ManLog 不提供医疗诊断，也不会将记录用于医疗结论。</text>
      </view>
      <view class="section">
        <text class="section-title">3. 存储与保护</text>
        <text class="paragraph">正式服务应通过 HTTPS 传输数据。事件类型和备注等敏感字段在服务端加密后存储，并按登录用户进行数据隔离。任何技术措施都不能保证绝对安全，我们会持续减少不必要的数据暴露。</text>
      </view>
      <view class="section">
        <text class="section-title">4. 信息共享</text>
        <text class="paragraph">除实现登录、云服务运行、法律法规要求或获得你的明确同意外，我们不会主动向无关第三方出售或共享个人记录。正式发布时应补充实际使用的云服务提供方及其处理范围。</text>
      </view>
      <view class="section">
        <text class="section-title">5. 你的选择</text>
        <text class="paragraph">你可以查看、编辑或删除自己的事件记录，也可以退出当前登录会话。账户注销、数据导出、完整数据删除及联系渠道将在正式发布前结合产品能力和运营信息进一步明确。</text>
      </view>
      <view class="section">
        <text class="section-title">6. 政策更新</text>
        <text class="paragraph">当功能、数据处理方式或适用规则发生变化时，我们会更新本政策，并通过页面版本或其他合理方式提示。</text>
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
