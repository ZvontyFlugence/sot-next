import React, { useEffect, useMemo, useState } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

interface ISelectComponent {
  className?: string,
  selected?: number | string,
  onChange?: (value: number | string) => void,
}

interface IOptionComponent {
  value: number | string,
  onClick?: () => void,
  disabled?: boolean,
}

interface ISelectOptions {
  Option: React.FC<IOptionComponent>,
}

const Select: React.FC<ISelectComponent> & ISelectOptions = ({ children, ...props }) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<number | string>(findSelected(props.selected)?.props?.value || children[0]?.props.value);
  const [selectedText, setSelectedText] = useState<React.ReactNode>(findSelected(props.selected)?.props?.children || children[0]?.props.children);

  function findSelected(value: number | string) {
    return (children as React.ReactElement[]).find((child: React.ReactElement) => {
      return child?.props?.value === props.selected;
    });
  }

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
    <div className={`relative ${props.className}`}>
      <div className='flex justify-between items-center bg-night text-white rounded py-2 px-4 cursor-pointer' onClick={() => setOpen(prev => !prev)}>
        <div className='flex gap-2'>
          {selectedText}
        </div>        
        <span className='ml-4'>
          {open ? (
            <IoIosArrowUp />
          ) : (
            <IoIosArrowDown />
          )}
        </span>
      </div>
      {open && (
        <div className='absolute top-12 w-max max-h-64 rounded bg-night text-white overflow-x-hidden overflow-y-auto shadow z-50'>
          {React.Children.map(children, (child: React.ReactElement) => {
            return !child.props.disabled ? (
              <Select.Option onClick={(e) => handleSelect(e, child?.props?.value, child?.props?.children)}  {...child.props} />
            ) : (
              <Select.Option {...child.props} />
            );
          })}
        </div>
      )}
    </div>
  );
}

const Option: React.FC<IOptionComponent> = ({ children, onClick, ...props }) => (
  <div className={`py-2 px-4 ${props.disabled ? '' : 'cursor-pointer hover:bg-accent'}`} onClick={onClick} {...props}>{children}</div>
);
Select.Option = Option;

export default Select;