import React from 'react';

interface ICardComponent {
  className?: string,
  onClick?: () => void,
}

interface ICardComponents {
  Header: React.FC<ICardComponent>,
  Content: React.FC<ICardComponent>,
  Footer: React.FC<ICardComponent>,
}

const Card: React.FC & ICardComponents = ({ children }) => {
  return (
    <div className='w-full p-4 shadow-md rounded-lg border-solid border-black border border-opacity-25 bg-white'>
      {children}
    </div>
  );
}

const Header: React.FC<ICardComponent> = ({ children, ...props}) => (
  <div {...props}>{children}</div>
);
Card.Header = Header;

const Content: React.FC<ICardComponent> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
Card.Content = Content;

const Footer: React.FC<ICardComponent> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
Card.Footer = Footer;

export default Card;