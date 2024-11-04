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
      3 types of information are collected:
      <br/>
      - Personal Information provided by Google when you log in (email, name).
      <br/>
      - Metadata on your database when we extract the structure of your database (table names, column names, etc).
      <br/>
      - Usage data (the prompts you use, the database errors you want to fix/explain, the answers given by the LLM).
      <br/>
      We do NOT collect any data contained in your database.
      <br/>
      <br/>
      <b>2. How We Use Your Information</b>
      <br/>
      <br/>
      Metabase Copilot does not share any of your data with anyone.
      <br/>
      We may however use your data to improve our service. For instance, we may update our system prompts based on the quality of the answers given by the LLM to your questions.
    </Description>
  );
}


const Description = styled.div`
  font-size: 14px;
  color: #4c5773;
  line-height: 20px;
`;


export default PrivacyPolicyTab;
