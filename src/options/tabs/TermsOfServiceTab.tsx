import styled from "styled-components";


const TermsOfServiceTab = () => {
  return (
    <Description>
      Welcome to Metabase Copilot. These Terms of Service ("Terms") govern your use of the Extension, including both free and paid tiers. By installing or using the Extension, you agree to these Terms. If you do not agree, please do not use the Extension.
      <br/>
      <br/>
      <b>1. Overview</b>
      <br/>
      <br/>
      Metabase Copilot is a Chrome extension designed for use with Metabase. The Extension allows users to access and analyze database metadata and provides interaction with a large language model (LLM) for query generation. The Extension does not access actual data from your database.
      <br/>
      <br/>
      <b>2. Use of the Service</b>
      <br/>
      <br/>
      You are granted a non-exclusive, non-transferable, revocable license to use the Extension subject to the following conditions:
      <br/>
      <br/>
      You agree not to misuse the Extension or use it for illegal purposes.
      You are responsible for maintaining the security of your account and any actions taken under your account.
      <br/>
      <br/>
      <b>3. Free and Paid Tiers</b>
      <br/>
      <br/>
      The Extension offers a free tier with limited features and a paid tier with additional functionality. The features available in each tier are clearly indicated in the Extension's documentation and pricing page.
      <br/>
      <br/>
      Free Tier:
      Limited access to features.
      Subject to certain usage limits (e.g., number of queries).
      Paid Tier:
      Full access to advanced features and priority support.
      Subscription fees apply and are subject to our billing policies.
      <br/>
      <br/>
      <b>4. Billing and Payments</b>
      <br/>
      <br/>
      If you upgrade to the paid tier, you agree to pay the applicable subscription fees. All payments are non-refundable except as required by law.
      <br/>
      <br/>
      <b>5. Privacy</b>
      <br/>
      <br/>
      Your privacy is important to us. The Extension collects minimal information, such as queries made to the LLM and responses, for the purpose of improving the service. We do not share this data with third parties. For more details, please refer to our Privacy Policy.
      <br/>
      <br/>
      <b>6. Intellectual Property</b>
      <br/>
      <br/>
      The intellectual property rights related to Metabase Copilot are governed by the license agreement available <a href="https://github.com/RobinPicard/metabase-copilot/blob/main/licence.txt">here</a>.
      <br/>
      <br/>
      <b>7. Termination</b> 
      <br/>
      <br/>
      We may suspend or terminate your access to the Extension at any time if you violate these Terms.
      <br/>
      <br/>
      <b>8. Limitation of Liability</b>
      <br/>
      <br/>
      The Extension is provided "as is." We make no warranties, express or implied, regarding its functionality or availability.
      <br/>
      <br/>
      <b>9. Changes to Terms</b>
      <br/>
      <br/>
      We may update these Terms from time to time. Any changes will be posted on this page, and your continued use of the Extension constitutes acceptance of the updated Terms.
      <br/>
      <br/>
      <b>10. Contact Us</b>
      <br/>
      <br/>
      If you have any questions about these Terms, please contact us at metabasecopilot@gmail.com.
    </Description>
  );
}


const Description = styled.div`
  font-size: 14px;
  color: var(--black);
  line-height: 20px;
`;


export default TermsOfServiceTab;
