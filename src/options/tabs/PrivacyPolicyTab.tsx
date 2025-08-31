import styled from "styled-components";


const PrivacyPolicyTab = () => {
  return (
    <Description>
      We are committed to protecting your privacy and ensuring transparency about how we collect, use, and store information. This Privacy Policy explains how your data is handled when you use Metabase Copilot.
      <br/>
      <br/>
      <b>1. Information We Collect</b>
      <br/>
      <br/>
      2 types of information are collected:
      <br/>
      - The API keys you provided to be able to make requests to LLM providers (OpenAI, Gemini or Anthropic).
      <br/>
      - Metadata on your database when we extract the structure of your database (table names, column names, etc).
      <br/>
      We do NOT collect any data contained in your database.
      <br/>
      <br/>
      <b>2. How We Use Your Information</b>
      <br/>
      <br/>
      Metabase Copilot does not share any of your data with anyone apart from the LLM provider you selected (when making requests to it).
    </Description>
  );
}


const Description = styled.div`
  font-size: 14px;
  color: var(--black);
  line-height: 20px;
`;


export default PrivacyPolicyTab;
