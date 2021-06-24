export default function MaintenancePage() {
  return (
    <div className='flex flex-col justify-center items-center h-screen w-full bg-night'>
      <h1 className='text-2xl text-accent font-semibold'>Under Maintenance</h1>
      <span className='text-lg text-white'>
        State of Turmoil is currently under maintenance, please check back again later
        while we work to get everything back up and running!
      </span>
    </div>
  );
}

export const getServerSideProps = async ctx => {
  if (!process.env.MAINTENANCE_MODE) {
    return {
      redirect: {
        permanent: false,
        destination: '/',
      },
    };
  }

  return {
    props: {},
  };
}