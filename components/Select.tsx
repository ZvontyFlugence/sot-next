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
  const [selectedValue, setSelectedValue] = useState<number | string>(findSelected()?.props?.value || children[0]?.props.value);

  function findSelected() {
    return (children as React.ReactElement[]).find((child: React.ReactElement) => {
      return child?.props?.value === props.selected;
    });
  }

  const getSelectedText = () => {
    if (typeof props.selected === 'number') {
      let elem = children[props.selected - 1];
      if (elem?.props.value === props.selected)
        return elem?.props.children;
    }
    
    if (props.selected)
      return findSelected()?.props.children;
    else
      return children[0]?.props.children;
  }

  const handleSelect = (e, value: number | string, text: React.ReactNode) => {
    e.stopPropagation();
    setSelectedValue(value);
    props.onChange(value);
    setOpen(false);
  }

  const windowClickListener = useMemo(() => { return function (this: Window, _ev: MouseEvent) { setOpen(false); }; }, [setOpen]);

  useEffect(() => {
    const child = findSelected();
    setSelectedValue(child?.props?.value ?? children[0]?.props.value);
  }, [props.selected]);

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
          {getSelectedText()}
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
            return !child?.props?.disabled ? (
              <Select.Option onClick={(e) => handleSelect(e, child?.props?.value, child?.props?.children)}  {...child?.props} />
            ) : (
              <Select.Option className='bg-gray-500 bg-opacity-25 px-2 py-1' {...child?.props} />
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