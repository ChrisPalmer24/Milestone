

export const numberProps = (field: {
  value: number;
  onChange: (value: number) => void;  
}) => {
  const { value, onChange } = field;
  return {
    type: "number",
    value: isNaN(value) || value === null ? 0 : value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
  };
}

export const dateToDateInputValue = (date: Date) => {
  return date.getFullYear() +
    "-" +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    date.getDate().toString().padStart(2, "0")
};
