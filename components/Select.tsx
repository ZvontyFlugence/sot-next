import React, { useEffect, useMemo, useState } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

interface ISelectComponent {
  className?: string,
  onChange?: (value: number | string) => void,
}

interface IOptionComponent {
  value: number | string,
  onClick?: () => void,
}

interface ISelectOptions {
  Option: React.FC<IOptionComponent>,
}

const Select: React.FC<ISelectComponent> & ISelectOptions = ({ children, ...props }) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(children[0].props.value);
  const [selectedText, setSelectedText] = useState<React.ReactNode>(children[0].props.children);

  const handleSelect = (e, value: number | string, text: React.ReactNode) => {
    e.stopPropagation();
    setSelectedValue(value);
    setSelectedText(text);
    setOpen(false);
  }

  const windowClickListener = useMemo(() => { return function (this: Window, ev: MouseEvent) { setOpen(false); }; }, [setOpen]);

  useEffect(() => {
    props.onChange(selectedValue);
  }, [selectedValue]);

  useEffect(() => {
    if (open) {
      window.addEventListener('click', windowClickListener);
    } else {
      window.removeEventListener('click', windowClickListener);
    }
  }, [open]);

  return (
    <div className='relative'>
      <div className='flex justify-between items-center bg-night text-white rounded py-2 px-4 cursor-pointer' onClick={() => setOpen(prev => !prev)}>
        {selectedText}
        <span className='ml-4'>
          {open ? (
            <IoIosArrowUp />
          ) : (
            <IoIosArrowDown />
          )}
        </span>
      </div>
      {open && (
        <div className='absolute top-12 w-max rounded bg-night text-white overflow-hidden shadow z-50'>
          {React.Children.map(children, (child: React.ReactElement) => {
            return (
              <Select.Option onClick={(e) => handleSelect(e, child.props.value, child.props.children)}  {...child.props} />
            );
          })}
        </div>
      )}
    </div>
  );
}

const Option: React.FC<IOptionComponent> = ({ children, ...props }) => (
  <div className='py-2 px-4 cursor-pointer hover:bg-accent' onClick={props?.onClick}>{children}</div>
);
Select.Option = Option;

export default Select;