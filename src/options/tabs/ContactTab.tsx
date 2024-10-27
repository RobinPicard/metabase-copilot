import styled from "styled-components";


const ContactTab = () => {
  return (
    <Description>
      For any questions, please contact us at metabasecopilot@gmail.com.<br/><br/>
      If you are reporting a bug, please include as much detail as possible.
    </Description>
  );
}


const Description = styled.div`
  font-size: 14px;
  color: var(--black);
  line-height: 20px;
`;


export default ContactTab;