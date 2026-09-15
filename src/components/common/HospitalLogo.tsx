type HospitalLogoProps = {
  className?: string;
};

export function HospitalLogo({ className = '' }: HospitalLogoProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.png`}
      alt="Mastan Hospital logo"
      width={500}
      height={500}
      className={`h-14 w-14 shrink-0 rounded-xl bg-white p-1 object-contain ${className}`}
    />
  );
}
