import multiavatar from '@multiavatar/multiavatar';

interface UserAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export default function UserAvatar({ name, size = 40, className = '' }: UserAvatarProps) {
  // Generamos el SVG basado en el nombre (o email)
  const svg = multiavatar(name);

  return (
    <div 
      className={`user-avatar ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
