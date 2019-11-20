import React from "react";
import styled from "@emotion/styled";
import { useTheme } from "@material-ui/core/styles";

interface ErrorListProps {
  errors: string[];
}

const ErrorListContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 0.7rem;
  color: ${props => props.color};
`;

const ErrorList: React.FunctionComponent<ErrorListProps> = ({ errors }) => {
  const theme = useTheme();
  return (
    <ErrorListContainer color={theme.palette.error.main}>
      {errors.map((e, i) => (
        <div key={i} style={{ display: "flex" }}>
          {e}
        </div>
      ))}
    </ErrorListContainer>
  );
};

export default ErrorList;
